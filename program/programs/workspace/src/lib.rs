use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6");

// Fix #1: cap rebalance logs to prevent unbounded rent drain on keeper
const MAX_REBALANCE_LOGS: u64 = 10_000;

#[program]
pub mod workspace {
    use super::*;

    // ================================================================
    // 1. INITIALIZE — Creates the global StrategyConfig PDA
    // ================================================================
    // fee_bps: u16, Platform fee on earned yield, 250 = 2.5%
    // treasury: Pubkey, Treasury address for fee collection, 9PJ8I...3555
    // min_rebalance_interval: u64, Minimum seconds between rebalances, 900 = 15 min
    // max_slippage_bps: u16, Maximum allowed slippage in basis points, 50 = 0.5%
    // oracle_staleness_threshold: u64, Max oracle age in seconds before feed is stale, 60
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_bps: u16,
        treasury: Pubkey,
        min_rebalance_interval: u64,
        max_slippage_bps: u16,
        oracle_staleness_threshold: u64,
    ) -> Result<()> {
        require!(fee_bps <= 10000, ErrorCode::InvalidFee);
        require!(max_slippage_bps <= 10000, ErrorCode::InvalidParameter);
        require!(min_rebalance_interval >= 60, ErrorCode::InvalidParameter);
        require!(oracle_staleness_threshold >= 10, ErrorCode::InvalidParameter);

        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        config.is_active = true;
        config.is_paused = false;
        config.fee_bps = fee_bps;
        config.treasury = treasury;
        config.min_rebalance_interval = min_rebalance_interval;
        config.max_slippage_bps = max_slippage_bps;
        config.oracle_staleness_threshold = oracle_staleness_threshold;
        config.total_positions = 0;
        config.version = 1;

        emit!(ConfigInitialized {
            authority: config.authority,
            fee_bps,
            treasury,
            min_rebalance_interval,
            max_slippage_bps,
        });
        Ok(())
    }

    // ================================================================
    // 2. UPDATE_PARAMS — Admin updates StrategyConfig parameters
    // ================================================================
    pub fn update_params(
        ctx: Context<UpdateParams>,
        fee_bps: Option<u16>,
        treasury: Option<Pubkey>,
        min_rebalance_interval: Option<u64>,
        max_slippage_bps: Option<u16>,
        oracle_staleness_threshold: Option<u64>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if let Some(fee) = fee_bps {
            require!(fee <= 10000, ErrorCode::InvalidFee);
            config.fee_bps = fee;
        }
        if let Some(addr) = treasury {
            config.treasury = addr;
        }
        if let Some(interval) = min_rebalance_interval {
            require!(interval >= 60, ErrorCode::InvalidParameter);
            config.min_rebalance_interval = interval;
        }
        if let Some(slippage) = max_slippage_bps {
            require!(slippage <= 10000, ErrorCode::InvalidParameter);
            config.max_slippage_bps = slippage;
        }
        if let Some(staleness) = oracle_staleness_threshold {
            require!(staleness >= 10, ErrorCode::InvalidParameter);
            config.oracle_staleness_threshold = staleness;
        }
        if let Some(paused) = is_paused {
            config.is_paused = paused;
        }

        emit!(ParamsUpdated {
            authority: ctx.accounts.authority.key(),
            fee_bps: config.fee_bps,
            is_paused: config.is_paused,
        });
        Ok(())
    }

    // ================================================================
    // 3. CREATE_POSITION (Phase 1) — Creates PositionState PDA
    //    Split from vault creation to stay ≤8 accounts per context
    // ================================================================
    pub fn create_position(
        ctx: Context<CreatePosition>,
        rebalance_interval: u64,
        center_range_bps: u16,
        wing_range_bps: u16,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);
        require!(
            rebalance_interval >= config.min_rebalance_interval,
            ErrorCode::RebalanceIntervalTooShort
        );
        require!(center_range_bps > 0 && center_range_bps <= 500, ErrorCode::InvalidParameter);
        require!(wing_range_bps > 0 && wing_range_bps <= 1000, ErrorCode::InvalidParameter);
        require!(
            ctx.accounts.token_a_mint.key() != ctx.accounts.token_b_mint.key(),
            ErrorCode::DuplicateMint
        );

        let position = &mut ctx.accounts.position;
        position.bump = ctx.bumps.position;
        position.owner = ctx.accounts.owner.key();
        position.config = ctx.accounts.config.key();
        position.token_a_mint = ctx.accounts.token_a_mint.key();
        position.token_b_mint = ctx.accounts.token_b_mint.key();
        position.token_a_vault = Pubkey::default();
        position.token_b_vault = Pubkey::default();
        position.rebalance_interval = rebalance_interval;
        position.center_range_bps = center_range_bps;
        position.wing_range_bps = wing_range_bps;
        position.center_allocation_pct = 80;
        position.wing_allocation_pct = 10;
        position.total_deposited_a = 0;
        position.total_deposited_b = 0;
        position.last_rebalance_ts = 0;
        position.rebalance_count = 0;
        position.is_active = false;
        position.is_initialized = false;
        position.created_at = Clock::get()?.unix_timestamp;
        position.current_center_tick = 0;
        position.center_liquidity = 0;
        position.upper_wing_liquidity = 0;
        position.lower_wing_liquidity = 0;

        let config = &mut ctx.accounts.config;
        config.total_positions = config.total_positions
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(PositionCreated {
            owner: ctx.accounts.owner.key(),
            position: ctx.accounts.position.key(),
            token_a_mint: ctx.accounts.token_a_mint.key(),
            token_b_mint: ctx.accounts.token_b_mint.key(),
            rebalance_interval,
            center_range_bps,
            wing_range_bps,
        });
        Ok(())
    }

    // ================================================================
    // 4. INIT_POSITION_VAULTS (Phase 2) — Creates token vault PDAs
    //    Activates the position after vaults are linked
    // ================================================================
    pub fn init_position_vaults(ctx: Context<InitPositionVaults>) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(!position.is_initialized, ErrorCode::AlreadyInitialized);

        position.token_a_vault = ctx.accounts.token_a_vault.key();
        position.token_b_vault = ctx.accounts.token_b_vault.key();
        position.is_active = true;
        position.is_initialized = true;

        emit!(VaultsInitialized {
            position: ctx.accounts.position.key(),
            token_a_vault: ctx.accounts.token_a_vault.key(),
            token_b_vault: ctx.accounts.token_b_vault.key(),
        });
        Ok(())
    }

    // ================================================================
    // 5. DEPOSIT — Transfer tokens from user into position vaults
    // ================================================================
    pub fn deposit(ctx: Context<Deposit>, amount_a: u64, amount_b: u64) -> Result<()> {
        let position = &ctx.accounts.position;
        require!(position.is_active && position.is_initialized, ErrorCode::PositionInactive);
        require!(amount_a > 0 || amount_b > 0, ErrorCode::InvalidAmount);

        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);

        if amount_a > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_a.to_account_info(),
                        to: ctx.accounts.vault_token_a.to_account_info(),
                        authority: ctx.accounts.owner.to_account_info(),
                    },
                ),
                amount_a,
            )?;
        }

        if amount_b > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_b.to_account_info(),
                        to: ctx.accounts.vault_token_b.to_account_info(),
                        authority: ctx.accounts.owner.to_account_info(),
                    },
                ),
                amount_b,
            )?;
        }

        let owner_key = ctx.accounts.owner.key();
        let position_key = ctx.accounts.position.key();

        let position = &mut ctx.accounts.position;
        position.total_deposited_a = position.total_deposited_a
            .checked_add(amount_a)
            .ok_or(ErrorCode::MathOverflow)?;
        position.total_deposited_b = position.total_deposited_b
            .checked_add(amount_b)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(DepositEvent {
            owner: owner_key,
            position: position_key,
            amount_a,
            amount_b,
            total_a: position.total_deposited_a,
            total_b: position.total_deposited_b,
        });
        Ok(())
    }

    // ================================================================
    // 6. WITHDRAW — Transfer tokens from position vaults back to user
    //    PDA signs as vault authority
    // ================================================================
    pub fn withdraw(ctx: Context<Withdraw>, amount_a: u64, amount_b: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);

        let position = &ctx.accounts.position;
        require!(position.is_active && position.is_initialized, ErrorCode::PositionInactive);
        require!(amount_a > 0 || amount_b > 0, ErrorCode::InvalidAmount);
        require!(
            amount_a <= position.total_deposited_a && amount_b <= position.total_deposited_b,
            ErrorCode::InsufficientFunds
        );

        let owner_key = ctx.accounts.owner.key();
        let token_a_mint_key = position.token_a_mint;
        let token_b_mint_key = position.token_b_mint;
        let bump_arr = [position.bump];

        if amount_a > 0 {
            let seeds = &[
                b"position",
                owner_key.as_ref(),
                token_a_mint_key.as_ref(),
                token_b_mint_key.as_ref(),
                &bump_arr,
            ];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_a.to_account_info(),
                        to: ctx.accounts.user_token_a.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_a,
            )?;
        }

        if amount_b > 0 {
            let seeds = &[
                b"position",
                owner_key.as_ref(),
                token_a_mint_key.as_ref(),
                token_b_mint_key.as_ref(),
                &bump_arr,
            ];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_b.to_account_info(),
                        to: ctx.accounts.user_token_b.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_b,
            )?;
        }

        let owner_key = ctx.accounts.owner.key();
        let position_key = ctx.accounts.position.key();

        let position = &mut ctx.accounts.position;
        position.total_deposited_a = position.total_deposited_a
            .checked_sub(amount_a)
            .ok_or(ErrorCode::MathOverflow)?;
        position.total_deposited_b = position.total_deposited_b
            .checked_sub(amount_b)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(WithdrawEvent {
            owner: owner_key,
            position: position_key,
            amount_a,
            amount_b,
            remaining_a: position.total_deposited_a,
            remaining_b: position.total_deposited_b,
        });
        Ok(())
    }

    // ================================================================
    // 7. REBALANCE — Keeper records a rebalance via delegated session key
    //    In production: CPI to Orca Whirlpools to close/open positions
    //    Current: Records state transitions + computes platform fees
    // ================================================================
    pub fn rebalance(
        ctx: Context<Rebalance>,
        new_center_tick: i32,
        total_fee_earned_a: u64,
        total_fee_earned_b: u64,
        observed_slippage_bps: u16,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);
        require!(
            observed_slippage_bps <= config.max_slippage_bps,
            ErrorCode::SlippageExceeded
        );

        let position = &ctx.accounts.position;
        require!(position.is_active && position.is_initialized, ErrorCode::PositionInactive);

        // Fix #1: cap rebalance logs — prevents unbounded rent drain on keeper
        require!(
            position.rebalance_count < MAX_REBALANCE_LOGS,
            ErrorCode::MaxLogsExceeded
        );

        let clock = Clock::get()?;
        let elapsed = clock.unix_timestamp
            .checked_sub(position.last_rebalance_ts)
            .ok_or(ErrorCode::MathOverflow)?;
        require!(
            position.last_rebalance_ts == 0 || elapsed >= position.rebalance_interval as i64,
            ErrorCode::RebalanceTooSoon
        );

        // --- Platform fee computation ---
        let fee_a = total_fee_earned_a
            .checked_mul(config.fee_bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::DivisionByZero)?;
        let fee_b = total_fee_earned_b
            .checked_mul(config.fee_bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::DivisionByZero)?;

        // --- Liquidity allocation computation (80/10/10) ---
        let total_liq_a = position.total_deposited_a;
        let center_liq = total_liq_a
            .checked_mul(position.center_allocation_pct as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::DivisionByZero)?;
        let wing_liq = total_liq_a
            .checked_mul(position.wing_allocation_pct as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::DivisionByZero)?;

        // --- CPI STUB: Orca Whirlpools ---
        // In production, the keeper agent performs the actual Orca CPIs
        // (close_position × 3 → open_position × 3) off-chain,
        // then calls this instruction to record the on-chain state.
        //
        // Future CPI integration points:
        // 1. whirlpool::close_position(center)
        // 2. whirlpool::close_position(upper_wing)
        // 3. whirlpool::close_position(lower_wing)
        // --- (split into second TX to stay ≤3 CPIs) ---
        // 4. whirlpool::open_position(new_center, center_liq)
        // 5. whirlpool::open_position(new_upper_wing, wing_liq)
        // 6. whirlpool::open_position(new_lower_wing, wing_liq)

        // --- Write RebalanceLog ---
        let log = &mut ctx.accounts.rebalance_log;
        log.bump = ctx.bumps.rebalance_log;
        log.position = ctx.accounts.position.key();
        log.rebalance_index = position.rebalance_count;
        log.old_center_tick = position.current_center_tick;
        log.new_center_tick = new_center_tick;
        log.fee_earned_a = total_fee_earned_a;
        log.fee_earned_b = total_fee_earned_b;
        log.platform_fee_a = fee_a;
        log.platform_fee_b = fee_b;
        log.observed_slippage_bps = observed_slippage_bps;
        log.center_liquidity = center_liq;
        log.upper_wing_liquidity = wing_liq;
        log.lower_wing_liquidity = wing_liq;
        log.timestamp = clock.unix_timestamp;

        // --- Extract keys before mutable borrow ---
        let position_key = ctx.accounts.position.key();
        let keeper_key = ctx.accounts.keeper.key();
        let old_tick = position.current_center_tick;
        let current_count = position.rebalance_count;

        // --- Update PositionState ---
        let position = &mut ctx.accounts.position;
        position.last_rebalance_ts = clock.unix_timestamp;
        position.current_center_tick = new_center_tick;
        position.center_liquidity = center_liq;
        position.upper_wing_liquidity = wing_liq;
        position.lower_wing_liquidity = wing_liq;
        position.rebalance_count = current_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(RebalanceEvent {
            position: position_key,
            keeper: keeper_key,
            old_center_tick: old_tick,
            new_center_tick,
            fee_earned_a: total_fee_earned_a,
            fee_earned_b: total_fee_earned_b,
            platform_fee_a: fee_a,
            platform_fee_b: fee_b,
            slippage_bps: observed_slippage_bps,
            rebalance_index: current_count,
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }

    // ================================================================
    // 8. DELEGATE_SESSION — Owner grants keeper a time-limited session key
    // ================================================================
    pub fn delegate_session(ctx: Context<DelegateSession>, expiry: i64) -> Result<()> {
        let clock = Clock::get()?;
        require!(expiry > clock.unix_timestamp, ErrorCode::InvalidParameter);
        let max_expiry = clock.unix_timestamp
            .checked_add(30 * 24 * 3600)
            .ok_or(ErrorCode::MathOverflow)?;
        require!(expiry <= max_expiry, ErrorCode::ExpiryTooFar);
        require!(
            ctx.accounts.delegate.key() != ctx.accounts.owner.key(),
            ErrorCode::SelfDelegation
        );

        let session = &mut ctx.accounts.session;
        session.bump = ctx.bumps.session;
        session.owner = ctx.accounts.owner.key();
        session.delegate = ctx.accounts.delegate.key();
        session.position = ctx.accounts.position.key();
        session.expiry = expiry;
        session.is_revoked = false;
        session.created_at = clock.unix_timestamp;

        emit!(SessionDelegated {
            owner: session.owner,
            delegate: session.delegate,
            position: session.position,
            expiry,
        });
        Ok(())
    }

    // ================================================================
    // 9. REVOKE_SESSION — Owner immediately revokes keeper access
    //    Fix #3: closes the session PDA (close = owner in context) so
    //    rent is returned and the same keeper can be re-delegated later
    // ================================================================
    pub fn revoke_session(ctx: Context<RevokeSession>) -> Result<()> {
        // Capture fields before account is closed by Anchor
        let owner = ctx.accounts.session.owner;
        let delegate = ctx.accounts.session.delegate;
        let position = ctx.accounts.session.position;

        emit!(SessionRevoked { owner, delegate, position });
        Ok(())
    }

    // ================================================================
    // 10. CLOSE_POSITION — Deactivates position after full withdrawal
    //     Fix #2: sweeps vault dust to owner before closing, so positions
    //     can never be permanently locked by sub-lamport token residuals
    // ================================================================
    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        let owner_key = ctx.accounts.owner.key();
        let token_a_mint_key = ctx.accounts.position.token_a_mint;
        let token_b_mint_key = ctx.accounts.position.token_b_mint;
        let bump_arr = [ctx.accounts.position.bump];

        let seeds = &[
            b"position",
            owner_key.as_ref(),
            token_a_mint_key.as_ref(),
            token_b_mint_key.as_ref(),
            &bump_arr,
        ];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        // Sweep any dust from vault_a → user before closing
        let dust_a = ctx.accounts.vault_token_a.amount;
        if dust_a > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_a.to_account_info(),
                        to: ctx.accounts.user_token_a.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                dust_a,
            )?;
        }

        // Sweep any dust from vault_b → user before closing
        let dust_b = ctx.accounts.vault_token_b.amount;
        if dust_b > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_b.to_account_info(),
                        to: ctx.accounts.user_token_b.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                dust_b,
            )?;
        }

        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::CloseAccount {
                    account: ctx.accounts.vault_token_a.to_account_info(),
                    destination: ctx.accounts.owner.to_account_info(),
                    authority: ctx.accounts.position.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::CloseAccount {
                    account: ctx.accounts.vault_token_b.to_account_info(),
                    destination: ctx.accounts.owner.to_account_info(),
                    authority: ctx.accounts.position.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        emit!(PositionClosed {
            owner: owner_key,
            position: ctx.accounts.position.key(),
        });
        Ok(())
    }

    // ================================================================
    // 11. EMERGENCY_WITHDRAW — Admin force-withdraws all vault funds
    //     to a user when protocol is paused (circuit breaker)
    // ================================================================
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_paused, ErrorCode::NotPaused);

        let position = &ctx.accounts.position;
        let owner_key = position.owner;
        let token_a_mint_key = position.token_a_mint;
        let token_b_mint_key = position.token_b_mint;
        let bump_arr = [position.bump];

        let amount_a = ctx.accounts.vault_token_a.amount;
        let amount_b = ctx.accounts.vault_token_b.amount;

        if amount_a > 0 {
            let seeds = &[
                b"position",
                owner_key.as_ref(),
                token_a_mint_key.as_ref(),
                token_b_mint_key.as_ref(),
                &bump_arr,
            ];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_a.to_account_info(),
                        to: ctx.accounts.user_token_a.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_a,
            )?;
        }

        if amount_b > 0 {
            let seeds = &[
                b"position",
                owner_key.as_ref(),
                token_a_mint_key.as_ref(),
                token_b_mint_key.as_ref(),
                &bump_arr,
            ];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_b.to_account_info(),
                        to: ctx.accounts.user_token_b.to_account_info(),
                        authority: ctx.accounts.position.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_b,
            )?;
        }

        let position_key = ctx.accounts.position.key();
        let position = &mut ctx.accounts.position;
        position.total_deposited_a = 0;
        position.total_deposited_b = 0;
        position.is_active = false;

        emit!(EmergencyWithdrawEvent {
            authority: ctx.accounts.authority.key(),
            position: position_key,
            owner: owner_key,
            amount_a,
            amount_b,
        });
        Ok(())
    }
}

// ====================================================================
// CONTEXT STRUCTS — Each ≤8 accounts (stack overflow prevention)
// ====================================================================

/// 3 accounts
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + StrategyConfig::LEN,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// 2 accounts
#[derive(Accounts)]
pub struct UpdateParams<'info> {
    #[account(
        mut,
        seeds = [b"config", authority.key().as_ref()],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub config: Account<'info, StrategyConfig>,
    pub authority: Signer<'info>,
}

/// 6 accounts — Phase 1: create PositionState PDA (no token accounts)
#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(
        mut,
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
        constraint = config.is_active && !config.is_paused @ ErrorCode::ConfigInactive,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(
        init,
        seeds = [b"position", owner.key().as_ref(), token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + PositionState::LEN,
    )]
    pub position: Account<'info, PositionState>,
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// 8 accounts — Phase 2: create token vault PDAs + activate position
#[derive(Accounts)]
pub struct InitPositionVaults<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump = position.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        constraint = !position.is_initialized @ ErrorCode::AlreadyInitialized,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        init,
        seeds = [b"vault_a", position.key().as_ref()],
        bump,
        payer = owner,
        token::mint = token_a_mint,
        token::authority = position,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds = [b"vault_b", position.key().as_ref()],
        bump,
        payer = owner,
        token::mint = token_b_mint,
        token::authority = position,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// 8 accounts
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
        constraint = config.is_active && !config.is_paused @ ErrorCode::ConfigInactive,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        constraint = position.is_active && position.is_initialized @ ErrorCode::PositionInactive,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        mut,
        constraint = vault_token_a.key() == position.token_a_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_b.key() == position.token_b_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_a.mint == position.token_a_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_a.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_b.mint == position.token_b_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_b.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/// 8 accounts
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
        constraint = config.is_active && !config.is_paused @ ErrorCode::ConfigInactive,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        constraint = position.is_active && position.is_initialized @ ErrorCode::PositionInactive,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        mut,
        constraint = vault_token_a.key() == position.token_a_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_b.key() == position.token_b_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_a.mint == position.token_a_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_a.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_b.mint == position.token_b_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_b.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/// 6 accounts — Keeper rebalance via delegated session key
#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
        constraint = config.is_active && !config.is_paused @ ErrorCode::ConfigInactive,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(
        mut,
        seeds = [b"position", position.owner.as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
        constraint = position.is_active && position.is_initialized @ ErrorCode::PositionInactive,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        init,
        seeds = [b"rebalance", position.key().as_ref(), &position.rebalance_count.to_le_bytes()],
        bump,
        payer = keeper,
        space = 8 + RebalanceLog::LEN,
    )]
    pub rebalance_log: Account<'info, RebalanceLog>,
    #[account(
        seeds = [b"session", position.owner.as_ref(), keeper.key().as_ref(), position.key().as_ref()],
        bump = session.bump,
        constraint = !session.is_revoked @ ErrorCode::SessionRevoked,
        constraint = session.expiry > Clock::get()?.unix_timestamp @ ErrorCode::SessionExpired,
        constraint = session.position == position.key() @ ErrorCode::Unauthorized,
    )]
    pub session: Account<'info, SessionKey>,
    #[account(mut)]
    pub keeper: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// 5 accounts
#[derive(Accounts)]
pub struct DelegateSession<'info> {
    #[account(
        seeds = [b"position", owner.key().as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        init,
        seeds = [b"session", owner.key().as_ref(), delegate.key().as_ref(), position.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + SessionKey::LEN,
    )]
    pub session: Account<'info, SessionKey>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: Delegate wallet address, validated by session PDA seed derivation
    pub delegate: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// 2 accounts — Fix #3: close = owner reclaims rent + allows re-delegation to same keeper
#[derive(Accounts)]
pub struct RevokeSession<'info> {
    #[account(
        mut,
        seeds = [b"session", owner.key().as_ref(), session.delegate.as_ref(), session.position.as_ref()],
        bump = session.bump,
        constraint = session.owner == owner.key() @ ErrorCode::Unauthorized,
        close = owner,
    )]
    pub session: Account<'info, SessionKey>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// 7 accounts — Close position + reclaim rent; sweeps any dust to user first
/// Fix #2: vault dust no longer blocks closure
#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
        has_one = owner @ ErrorCode::Unauthorized,
        // Only require accounting balance == 0 (user must have withdrawn via withdraw ix)
        // Actual vault.amount may have dust that we sweep below
        constraint = position.total_deposited_a == 0 && position.total_deposited_b == 0 @ ErrorCode::PositionNotEmpty,
        close = owner,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        mut,
        constraint = vault_token_a.key() == position.token_a_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_b.key() == position.token_b_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_a.mint == position.token_a_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_a.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_b.mint == position.token_b_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_b.owner == owner.key() @ ErrorCode::Unauthorized,
    )]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/// 8 accounts — Admin emergency withdraw when protocol is paused
#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        seeds = [b"config", authority.key().as_ref()],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized,
        constraint = config.is_paused @ ErrorCode::NotPaused,
    )]
    pub config: Account<'info, StrategyConfig>,
    #[account(
        mut,
        seeds = [b"position", position.owner.as_ref(), position.token_a_mint.as_ref(), position.token_b_mint.as_ref()],
        bump = position.bump,
    )]
    pub position: Account<'info, PositionState>,
    #[account(
        mut,
        constraint = vault_token_a.key() == position.token_a_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_b.key() == position.token_b_vault @ ErrorCode::InvalidParameter,
    )]
    pub vault_token_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_a.mint == position.token_a_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_a.owner == position.owner @ ErrorCode::Unauthorized,
    )]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_b.mint == position.token_b_mint @ ErrorCode::InvalidParameter,
        constraint = user_token_b.owner == position.owner @ ErrorCode::Unauthorized,
    )]
    pub user_token_b: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ====================================================================
// STATE — PDA Account Structs
// ====================================================================

/// Global platform configuration (1 per authority)
/// Seeds: [b"config", authority.key().as_ref()]
#[account]
pub struct StrategyConfig {
    pub bump: u8,                          // 1
    pub authority: Pubkey,                 // 32
    pub is_active: bool,                   // 1
    pub is_paused: bool,                   // 1
    pub fee_bps: u16,                      // 2
    pub treasury: Pubkey,                  // 32
    pub min_rebalance_interval: u64,       // 8
    pub max_slippage_bps: u16,             // 2
    pub oracle_staleness_threshold: u64,   // 8
    pub total_positions: u64,              // 8
    pub version: u8,                       // 1
}

impl StrategyConfig {
    pub const LEN: usize = 1 + 32 + 1 + 1 + 2 + 32 + 8 + 2 + 8 + 8 + 1;
}

/// Per-user concentrated liquidity position
/// Seeds: [b"position", owner.key().as_ref(), token_a_mint.key().as_ref(), token_b_mint.key().as_ref()]
#[account]
pub struct PositionState {
    pub bump: u8,                          // 1
    pub owner: Pubkey,                     // 32
    pub config: Pubkey,                    // 32
    pub token_a_mint: Pubkey,              // 32
    pub token_b_mint: Pubkey,              // 32
    pub token_a_vault: Pubkey,             // 32
    pub token_b_vault: Pubkey,             // 32
    pub rebalance_interval: u64,           // 8
    pub center_range_bps: u16,             // 2
    pub wing_range_bps: u16,               // 2
    pub center_allocation_pct: u8,         // 1
    pub wing_allocation_pct: u8,           // 1
    pub total_deposited_a: u64,            // 8
    pub total_deposited_b: u64,            // 8
    pub last_rebalance_ts: i64,            // 8
    pub rebalance_count: u64,              // 8
    pub is_active: bool,                   // 1
    pub is_initialized: bool,              // 1
    pub created_at: i64,                   // 8
    pub current_center_tick: i32,          // 4
    pub center_liquidity: u64,             // 8
    pub upper_wing_liquidity: u64,         // 8
    pub lower_wing_liquidity: u64,         // 8
}

impl PositionState {
    pub const LEN: usize = 1 + 32 + 32 + 32 + 32 + 32 + 32 + 8 + 2 + 2 + 1 + 1 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 4 + 8 + 8 + 8;
}

/// Immutable log of each rebalance event
/// Seeds: [b"rebalance", position.key().as_ref(), &rebalance_count.to_le_bytes()]
#[account]
pub struct RebalanceLog {
    pub bump: u8,                          // 1
    pub position: Pubkey,                  // 32
    pub rebalance_index: u64,              // 8
    pub old_center_tick: i32,              // 4
    pub new_center_tick: i32,              // 4
    pub fee_earned_a: u64,                 // 8
    pub fee_earned_b: u64,                 // 8
    pub platform_fee_a: u64,              // 8
    pub platform_fee_b: u64,              // 8
    pub observed_slippage_bps: u16,        // 2
    pub center_liquidity: u64,             // 8
    pub upper_wing_liquidity: u64,         // 8
    pub lower_wing_liquidity: u64,         // 8
    pub timestamp: i64,                    // 8
}

impl RebalanceLog {
    pub const LEN: usize = 1 + 32 + 8 + 4 + 4 + 8 + 8 + 8 + 8 + 2 + 8 + 8 + 8 + 8;
}

/// Non-custodial session key for keeper delegation
/// Seeds: [b"session", owner.key().as_ref(), delegate.key().as_ref(), position.key().as_ref()]
#[account]
pub struct SessionKey {
    pub bump: u8,                          // 1
    pub owner: Pubkey,                     // 32
    pub delegate: Pubkey,                  // 32
    pub position: Pubkey,                  // 32
    pub expiry: i64,                       // 8
    pub is_revoked: bool,                  // 1
    pub created_at: i64,                   // 8
}

impl SessionKey {
    pub const LEN: usize = 1 + 32 + 32 + 32 + 8 + 1 + 8;
}

// ====================================================================
// EVENTS — Emitted for frontend/keeper monitoring
// ====================================================================

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub treasury: Pubkey,
    pub min_rebalance_interval: u64,
    pub max_slippage_bps: u16,
}

#[event]
pub struct ParamsUpdated {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub is_paused: bool,
}

#[event]
pub struct PositionCreated {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub rebalance_interval: u64,
    pub center_range_bps: u16,
    pub wing_range_bps: u16,
}

#[event]
pub struct VaultsInitialized {
    pub position: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
}

#[event]
pub struct DepositEvent {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub total_a: u64,
    pub total_b: u64,
}

#[event]
pub struct WithdrawEvent {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub remaining_a: u64,
    pub remaining_b: u64,
}

#[event]
pub struct RebalanceEvent {
    pub position: Pubkey,
    pub keeper: Pubkey,
    pub old_center_tick: i32,
    pub new_center_tick: i32,
    pub fee_earned_a: u64,
    pub fee_earned_b: u64,
    pub platform_fee_a: u64,
    pub platform_fee_b: u64,
    pub slippage_bps: u16,
    pub rebalance_index: u64,
    pub timestamp: i64,
}

#[event]
pub struct SessionDelegated {
    pub owner: Pubkey,
    pub delegate: Pubkey,
    pub position: Pubkey,
    pub expiry: i64,
}

#[event]
pub struct SessionRevoked {
    pub owner: Pubkey,
    pub delegate: Pubkey,
    pub position: Pubkey,
}

#[event]
pub struct PositionClosed {
    pub owner: Pubkey,
    pub position: Pubkey,
}

// ====================================================================
// ERROR CODES
// ====================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Config is inactive or paused")]
    ConfigInactive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid parameter")]
    InvalidParameter,
    #[msg("Invalid fee")]
    InvalidFee,
    #[msg("Position is inactive or not initialized")]
    PositionInactive,
    #[msg("Position has remaining funds")]
    PositionNotEmpty,
    #[msg("Rebalance interval too short")]
    RebalanceIntervalTooShort,
    #[msg("Rebalance too soon")]
    RebalanceTooSoon,
    #[msg("Slippage exceeded maximum")]
    SlippageExceeded,
    #[msg("Session key expired")]
    SessionExpired,
    #[msg("Session key revoked")]
    SessionRevoked,
    #[msg("Already initialized")]
    AlreadyInitialized,
    #[msg("Protocol must be paused for emergency actions")]
    NotPaused,
    #[msg("Token A and Token B mints must be different")]
    DuplicateMint,
    #[msg("Cannot delegate session to yourself")]
    SelfDelegation,
    #[msg("Session expiry exceeds maximum (30 days)")]
    ExpiryTooFar,
    #[msg("Maximum rebalance logs reached for this position")]
    MaxLogsExceeded,
}

#[event]
pub struct EmergencyWithdrawEvent {
    pub authority: Pubkey,
    pub position: Pubkey,
    pub owner: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
}