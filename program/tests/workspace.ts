import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("stable_yield_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.workspace as Program<Workspace>;

  const authority = Keypair.generate();
  const user = Keypair.generate();
  const delegate = Keypair.generate();
  const treasury = Keypair.generate();
  const mintAKeypair = Keypair.generate();
  const mintBKeypair = Keypair.generate();

  let configPDA: PublicKey;
  let positionPDA: PublicKey;
  let vaultTokenA: PublicKey;
  let vaultTokenB: PublicKey;
  let userTokenA: PublicKey;
  let userTokenB: PublicKey;
  let sessionPDA: PublicKey;

  const FEE_BPS = 250;
  const MIN_REBALANCE_INTERVAL = 900;
  const MAX_SLIPPAGE_BPS = 50;
  const ORACLE_STALENESS = 60;
  const REBALANCE_INTERVAL = 900;
  const CENTER_RANGE_BPS = 25;
  const WING_RANGE_BPS = 100;
  const MINT_DECIMALS = 6;
  const MINT_AMOUNT = 1_000_000_000;

  before(async () => {
    // Fund all test accounts with 100 SOL
    const airdropAuth = await provider.connection.requestAirdrop(
      authority.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropAuth);

    const airdropUser = await provider.connection.requestAirdrop(
      user.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropUser);

    const airdropDelegate = await provider.connection.requestAirdrop(
      delegate.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropDelegate);

    // Derive config PDA
    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), authority.publicKey.toBuffer()],
      program.programId
    );

    // Create USDC-like mint A and USDT-like mint B
    const lamports = await getMinimumBalanceForRentExemptMint(
      provider.connection
    );

    const createMintATx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintAKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintAKeypair.publicKey,
        MINT_DECIMALS,
        authority.publicKey,
        null
      )
    );
    await provider.sendAndConfirm(createMintATx, [authority, mintAKeypair]);

    const createMintBTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintBKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintBKeypair.publicKey,
        MINT_DECIMALS,
        authority.publicKey,
        null
      )
    );
    await provider.sendAndConfirm(createMintBTx, [authority, mintBKeypair]);

    // Derive position PDA
    [positionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user.publicKey.toBuffer(),
        mintAKeypair.publicKey.toBuffer(),
        mintBKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Derive token vault PDAs
    [vaultTokenA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_a"), positionPDA.toBuffer()],
      program.programId
    );
    [vaultTokenB] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_b"), positionPDA.toBuffer()],
      program.programId
    );

    // Create user ATAs
    userTokenA = await getAssociatedTokenAddress(
      mintAKeypair.publicKey,
      user.publicKey
    );
    userTokenB = await getAssociatedTokenAddress(
      mintBKeypair.publicKey,
      user.publicKey
    );

    const createAtaTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        user.publicKey,
        userTokenA,
        user.publicKey,
        mintAKeypair.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        user.publicKey,
        userTokenB,
        user.publicKey,
        mintBKeypair.publicKey
      )
    );
    await provider.sendAndConfirm(createAtaTx, [user]);

    // Mint 1000 tokens of each to user
    const mintToTx = new Transaction().add(
      createMintToInstruction(
        mintAKeypair.publicKey,
        userTokenA,
        authority.publicKey,
        MINT_AMOUNT
      ),
      createMintToInstruction(
        mintBKeypair.publicKey,
        userTokenB,
        authority.publicKey,
        MINT_AMOUNT
      )
    );
    await provider.sendAndConfirm(mintToTx, [authority]);

    // Derive session PDA
    [sessionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("session"),
        user.publicKey.toBuffer(),
        delegate.publicKey.toBuffer(),
        positionPDA.toBuffer(),
      ],
      program.programId
    );
  });

  // ================================================================
  // 1. INITIALIZE CONFIG
  // ================================================================
  it("1. Initialize Config — creates StrategyConfig PDA", async () => {
    await program.methods
      .initializeConfig(
        FEE_BPS,
        treasury.publicKey,
        new BN(MIN_REBALANCE_INTERVAL),
        MAX_SLIPPAGE_BPS,
        new BN(ORACLE_STALENESS)
      )
      .accounts({
        config: configPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const config = await program.account.strategyConfig.fetch(configPDA);
    expect(config.isActive).to.be.true;
    expect(config.isPaused).to.be.false;
    expect(Number(config.feeBps)).to.equal(FEE_BPS);
    expect(config.treasury.toBase58()).to.equal(treasury.publicKey.toBase58());
    expect(Number(config.minRebalanceInterval.toString())).to.equal(
      MIN_REBALANCE_INTERVAL
    );
    expect(Number(config.maxSlippageBps)).to.equal(MAX_SLIPPAGE_BPS);
    expect(Number(config.oracleStalenessThreshold.toString())).to.equal(
      ORACLE_STALENESS
    );
    expect(Number(config.totalPositions.toString())).to.equal(0);
    expect(Number(config.version)).to.equal(1);
  });

  // ================================================================
  // 2. UPDATE PARAMS
  // ================================================================
  it("2. Update Params — admin updates fee and treasury", async () => {
    const newTreasury = Keypair.generate().publicKey;

    await program.methods
      .updateParams(500, newTreasury, null, null, null, null)
      .accounts({
        config: configPDA,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const config = await program.account.strategyConfig.fetch(configPDA);
    expect(Number(config.feeBps)).to.equal(500);
    expect(config.treasury.toBase58()).to.equal(newTreasury.toBase58());

    // Restore original values for subsequent tests
    await program.methods
      .updateParams(FEE_BPS, treasury.publicKey, null, null, null, null)
      .accounts({
        config: configPDA,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();
  });

  // ================================================================
  // 3. CREATE POSITION (Phase 1)
  // ================================================================
  it("3. Create Position — Phase 1: creates PositionState PDA", async () => {
    await program.methods
      .createPosition(
        new BN(REBALANCE_INTERVAL),
        CENTER_RANGE_BPS,
        WING_RANGE_BPS
      )
      .accounts({
        config: configPDA,
        position: positionPDA,
        tokenAMint: mintAKeypair.publicKey,
        tokenBMint: mintBKeypair.publicKey,
        owner: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const position = await program.account.positionState.fetch(positionPDA);
    expect(position.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(Number(position.centerRangeBps)).to.equal(CENTER_RANGE_BPS);
    expect(Number(position.wingRangeBps)).to.equal(WING_RANGE_BPS);
    expect(Number(position.centerAllocationPct)).to.equal(80);
    expect(Number(position.wingAllocationPct)).to.equal(10);
    expect(Number(position.rebalanceCount.toString())).to.equal(0);
    expect(position.isActive).to.be.false;
    expect(position.isInitialized).to.be.false;

    const config = await program.account.strategyConfig.fetch(configPDA);
    expect(Number(config.totalPositions.toString())).to.equal(1);
  });

  // ================================================================
  // 4. INIT POSITION VAULTS (Phase 2)
  // ================================================================
  it("4. Init Position Vaults — Phase 2: creates token vaults + activates", async () => {
    await program.methods
      .initPositionVaults()
      .accounts({
        position: positionPDA,
        tokenAVault: vaultTokenA,
        tokenBVault: vaultTokenB,
        tokenAMint: mintAKeypair.publicKey,
        tokenBMint: mintBKeypair.publicKey,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const position = await program.account.positionState.fetch(positionPDA);
    expect(position.isActive).to.be.true;
    expect(position.isInitialized).to.be.true;
    expect(position.tokenAVault.toBase58()).to.equal(vaultTokenA.toBase58());
    expect(position.tokenBVault.toBase58()).to.equal(vaultTokenB.toBase58());
  });

  // ================================================================
  // 5. DEPOSIT
  // ================================================================
  it("5. Deposit — transfers 500 USDC + 500 USDT into vaults", async () => {
    const depositA = 500_000_000;
    const depositB = 500_000_000;

    await program.methods
      .deposit(new BN(depositA), new BN(depositB))
      .accounts({
        config: configPDA,
        position: positionPDA,
        vaultTokenA: vaultTokenA,
        vaultTokenB: vaultTokenB,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const position = await program.account.positionState.fetch(positionPDA);
    expect(Number(position.totalDepositedA.toString())).to.equal(depositA);
    expect(Number(position.totalDepositedB.toString())).to.equal(depositB);

    const vaultA = await getAccount(provider.connection, vaultTokenA);
    expect(Number(vaultA.amount.toString())).to.equal(depositA);
    const vaultB = await getAccount(provider.connection, vaultTokenB);
    expect(Number(vaultB.amount.toString())).to.equal(depositB);
  });

  // ================================================================
  // 6. WITHDRAW
  // ================================================================
  it("6. Withdraw — partial withdrawal of 100 from each token", async () => {
    const withdrawA = 100_000_000;
    const withdrawB = 100_000_000;

    await program.methods
      .withdraw(new BN(withdrawA), new BN(withdrawB))
      .accounts({
        config: configPDA,
        position: positionPDA,
        vaultTokenA: vaultTokenA,
        vaultTokenB: vaultTokenB,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const position = await program.account.positionState.fetch(positionPDA);
    expect(Number(position.totalDepositedA.toString())).to.equal(400_000_000);
    expect(Number(position.totalDepositedB.toString())).to.equal(400_000_000);
  });

  // ================================================================
  // 7. DELEGATE SESSION
  // ================================================================
  it("7. Delegate Session — grants keeper 24h session key", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 86400;

    await program.methods
      .delegateSession(new BN(expiry))
      .accounts({
        position: positionPDA,
        session: sessionPDA,
        owner: user.publicKey,
        delegate: delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const session = await program.account.sessionKey.fetch(sessionPDA);
    expect(session.isRevoked).to.be.false;
    expect(session.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(session.delegate.toBase58()).to.equal(
      delegate.publicKey.toBase58()
    );
    expect(session.position.toBase58()).to.equal(positionPDA.toBase58());
    expect(Number(session.expiry.toString())).to.equal(expiry);
  });

  // ================================================================
  // 8. REBALANCE
  // ================================================================
  it("8. Rebalance — keeper records rebalance with fee accounting", async () => {
    const rebalanceIndex = 0;
    const [rebalancePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rebalance"),
        positionPDA.toBuffer(),
        new BN(rebalanceIndex).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .rebalance(100, new BN(5000), new BN(4500), 10)
      .accounts({
        config: configPDA,
        position: positionPDA,
        rebalanceLog: rebalancePDA,
        session: sessionPDA,
        keeper: delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([delegate])
      .rpc();

    const log = await program.account.rebalanceLog.fetch(rebalancePDA);
    expect(Number(log.newCenterTick)).to.equal(100);
    expect(Number(log.feeEarnedA.toString())).to.equal(5000);
    expect(Number(log.feeEarnedB.toString())).to.equal(4500);
    expect(Number(log.observedSlippageBps)).to.equal(10);

    const expectedFeeA = Math.floor((5000 * FEE_BPS) / 10000);
    const expectedFeeB = Math.floor((4500 * FEE_BPS) / 10000);
    expect(Number(log.platformFeeA.toString())).to.equal(expectedFeeA);
    expect(Number(log.platformFeeB.toString())).to.equal(expectedFeeB);

    // Verify liquidity allocation (80/10/10 of 400M deposited_a)
    expect(Number(log.centerLiquidity.toString())).to.equal(320_000_000);
    expect(Number(log.upperWingLiquidity.toString())).to.equal(40_000_000);
    expect(Number(log.lowerWingLiquidity.toString())).to.equal(40_000_000);

    const position = await program.account.positionState.fetch(positionPDA);
    expect(Number(position.rebalanceCount.toString())).to.equal(1);
    expect(Number(position.currentCenterTick)).to.equal(100);
    expect(Number(position.centerLiquidity.toString())).to.equal(320_000_000);
  });

  // ================================================================
  // 9. REVOKE SESSION
  // ================================================================
  it("9. Revoke Session — owner revokes keeper access", async () => {
    await program.methods
      .revokeSession()
      .accounts({
        session: sessionPDA,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();

    const session = await program.account.sessionKey.fetch(sessionPDA);
    expect(session.isRevoked).to.be.true;
  });

  // ================================================================
  // 10. REBALANCE BLOCKED — revoked session key fails
  // ================================================================
  it("10. Rebalance blocked — revoked session rejected", async () => {
    const [rebalancePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rebalance"),
        positionPDA.toBuffer(),
        new BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .rebalance(200, new BN(1000), new BN(1000), 5)
        .accounts({
          config: configPDA,
          position: positionPDA,
          rebalanceLog: rebalancePDA,
          session: sessionPDA,
          keeper: delegate.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([delegate])
        .rpc();
      expect.fail("Should have failed with revoked session");
    } catch (error) {
      expect(error.message).to.include("SessionRevoked");
    }
  });

  // ================================================================
  // 11. SLIPPAGE EXCEEDED — rebalance rejected over max slippage
  // ================================================================
  it("11. Slippage guard — rebalance rejected when slippage exceeds max", async () => {
    // Re-delegate a fresh session for this test
    const delegate2 = Keypair.generate();
    const airdrop = await provider.connection.requestAirdrop(
      delegate2.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop);

    const [session2PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("session"),
        user.publicKey.toBuffer(),
        delegate2.publicKey.toBuffer(),
        positionPDA.toBuffer(),
      ],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .delegateSession(new BN(now + 86400))
      .accounts({
        position: positionPDA,
        session: session2PDA,
        owner: user.publicKey,
        delegate: delegate2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const [rebalancePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rebalance"),
        positionPDA.toBuffer(),
        new BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      // observed_slippage_bps = 999 > max_slippage_bps = 50
      await program.methods
        .rebalance(150, new BN(1000), new BN(1000), 999)
        .accounts({
          config: configPDA,
          position: positionPDA,
          rebalanceLog: rebalancePDA,
          session: session2PDA,
          keeper: delegate2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([delegate2])
        .rpc();
      expect.fail("Should have failed with slippage exceeded");
    } catch (error) {
      expect(error.message).to.include("SlippageExceeded");
    }
  });

  // ================================================================
  // 12. WITHDRAW FAILS — insufficient funds
  // ================================================================
  it("12. Withdraw guard — insufficient funds rejected", async () => {
    try {
      await program.methods
        .withdraw(new BN(999_000_000_000), new BN(0))
        .accounts({
          config: configPDA,
          position: positionPDA,
          vaultTokenA: vaultTokenA,
          vaultTokenB: vaultTokenB,
          userTokenA: userTokenA,
          userTokenB: userTokenB,
          owner: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have failed with insufficient funds");
    } catch (error) {
      expect(error.message).to.include("InsufficientFunds");
    }
  });

  // ================================================================
  // 13. CLOSE POSITION FAILS — not empty
  // ================================================================
  it("13. Close guard — position with funds cannot close", async () => {
    try {
      await program.methods
        .closePosition()
        .accounts({
          position: positionPDA,
          vaultTokenA: vaultTokenA,
          vaultTokenB: vaultTokenB,
          owner: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have failed - position not empty");
    } catch (error) {
      expect(error.message).to.include("PositionNotEmpty");
    }
  });

  // ================================================================
  // 14. CLOSE POSITION — after full withdrawal, rent reclaimed
  // ================================================================
  it("14. Close Position — full withdraw then close w/ rent reclaim", async () => {
    // Withdraw all remaining funds
    await program.methods
      .withdraw(new BN(400_000_000), new BN(400_000_000))
      .accounts({
        config: configPDA,
        position: positionPDA,
        vaultTokenA: vaultTokenA,
        vaultTokenB: vaultTokenB,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const balBefore = await provider.connection.getBalance(user.publicKey);

    await program.methods
      .closePosition()
      .accounts({
        position: positionPDA,
        vaultTokenA: vaultTokenA,
        vaultTokenB: vaultTokenB,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const balAfter = await provider.connection.getBalance(user.publicKey);
    // Owner should have received rent back (minus tx fee)
    expect(balAfter).to.be.greaterThan(balBefore - 20000);

    // Position account should be closed (fetch should fail)
    try {
      await program.account.positionState.fetch(positionPDA);
      expect.fail("Position account should be closed");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });

  // ================================================================
  // 15. EMERGENCY WITHDRAW — admin force-drains vaults when paused
  // ================================================================
  it("15. Emergency Withdraw — admin drains vaults when paused", async () => {
    // --- Setup: create a new position for emergency withdraw testing ---
    const user2 = Keypair.generate();
    const airdropU2 = await provider.connection.requestAirdrop(
      user2.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropU2);

    const mintC = Keypair.generate();
    const mintD = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);

    const createMintsRx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintC.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintC.publicKey, 6, authority.publicKey, null),
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintD.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintD.publicKey, 6, authority.publicKey, null)
    );
    await provider.sendAndConfirm(createMintsRx, [authority, mintC, mintD]);

    // Derive position & vault PDAs
    const [pos2PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user2.publicKey.toBuffer(), mintC.publicKey.toBuffer(), mintD.publicKey.toBuffer()],
      program.programId
    );
    const [vaultC] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_a"), pos2PDA.toBuffer()],
      program.programId
    );
    const [vaultD] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_b"), pos2PDA.toBuffer()],
      program.programId
    );

    // Create position + vaults
    await program.methods
      .createPosition(new BN(REBALANCE_INTERVAL), CENTER_RANGE_BPS, WING_RANGE_BPS)
      .accounts({
        config: configPDA,
        position: pos2PDA,
        tokenAMint: mintC.publicKey,
        tokenBMint: mintD.publicKey,
        owner: user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    await program.methods
      .initPositionVaults()
      .accounts({
        position: pos2PDA,
        tokenAVault: vaultC,
        tokenBVault: vaultD,
        tokenAMint: mintC.publicKey,
        tokenBMint: mintD.publicKey,
        owner: user2.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    // Create user2 ATAs and deposit
    const user2TokenC = await getAssociatedTokenAddress(mintC.publicKey, user2.publicKey);
    const user2TokenD = await getAssociatedTokenAddress(mintD.publicKey, user2.publicKey);

    const ataAndMintTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(user2.publicKey, user2TokenC, user2.publicKey, mintC.publicKey),
      createAssociatedTokenAccountInstruction(user2.publicKey, user2TokenD, user2.publicKey, mintD.publicKey),
      createMintToInstruction(mintC.publicKey, user2TokenC, authority.publicKey, 200_000_000),
      createMintToInstruction(mintD.publicKey, user2TokenD, authority.publicKey, 200_000_000)
    );
    await provider.sendAndConfirm(ataAndMintTx, [user2, authority]);

    await program.methods
      .deposit(new BN(200_000_000), new BN(200_000_000))
      .accounts({
        config: configPDA,
        position: pos2PDA,
        vaultTokenA: vaultC,
        vaultTokenB: vaultD,
        userTokenA: user2TokenC,
        userTokenB: user2TokenD,
        owner: user2.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user2])
      .rpc();

    // Pause the protocol
    await program.methods
      .updateParams(null, null, null, null, null, true)
      .accounts({ config: configPDA, authority: authority.publicKey })
      .signers([authority])
      .rpc();

    // Emergency withdraw
    await program.methods
      .emergencyWithdraw()
      .accounts({
        config: configPDA,
        position: pos2PDA,
        vaultTokenA: vaultC,
        vaultTokenB: vaultD,
        userTokenA: user2TokenC,
        userTokenB: user2TokenD,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    // Verify vaults are drained
    const vCA = await getAccount(provider.connection, vaultC);
    expect(Number(vCA.amount)).to.equal(0);
    const vDA = await getAccount(provider.connection, vaultD);
    expect(Number(vDA.amount)).to.equal(0);

    // Verify user2 got tokens back
    const u2C = await getAccount(provider.connection, user2TokenC);
    expect(Number(u2C.amount)).to.equal(200_000_000);
    const u2D = await getAccount(provider.connection, user2TokenD);
    expect(Number(u2D.amount)).to.equal(200_000_000);

    // Position marked inactive
    const pos2 = await program.account.positionState.fetch(pos2PDA);
    expect(pos2.isActive).to.be.false;
    expect(Number(pos2.totalDepositedA.toString())).to.equal(0);
    expect(Number(pos2.totalDepositedB.toString())).to.equal(0);

    // Unpause for remaining tests
    await program.methods
      .updateParams(null, null, null, null, null, false)
      .accounts({ config: configPDA, authority: authority.publicKey })
      .signers([authority])
      .rpc();
  });

  // ================================================================
  // 16. EMERGENCY WITHDRAW FAILS — when protocol not paused
  // ================================================================
  it("16. Emergency guard — rejected when protocol not paused", async () => {
    // Create a minimal position for this test
    const user3 = Keypair.generate();
    const airdropU3 = await provider.connection.requestAirdrop(
      user3.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropU3);

    const mintE = Keypair.generate();
    const mintF = Keypair.generate();
    const lamports2 = await getMinimumBalanceForRentExemptMint(provider.connection);

    const cMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintE.publicKey,
        space: MINT_SIZE,
        lamports: lamports2,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintE.publicKey, 6, authority.publicKey, null),
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mintF.publicKey,
        space: MINT_SIZE,
        lamports: lamports2,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintF.publicKey, 6, authority.publicKey, null)
    );
    await provider.sendAndConfirm(cMintTx, [authority, mintE, mintF]);

    const [pos3PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user3.publicKey.toBuffer(), mintE.publicKey.toBuffer(), mintF.publicKey.toBuffer()],
      program.programId
    );
    const [vaultE] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_a"), pos3PDA.toBuffer()],
      program.programId
    );
    const [vaultF] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_b"), pos3PDA.toBuffer()],
      program.programId
    );

    await program.methods
      .createPosition(new BN(REBALANCE_INTERVAL), CENTER_RANGE_BPS, WING_RANGE_BPS)
      .accounts({
        config: configPDA,
        position: pos3PDA,
        tokenAMint: mintE.publicKey,
        tokenBMint: mintF.publicKey,
        owner: user3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user3])
      .rpc();

    await program.methods
      .initPositionVaults()
      .accounts({
        position: pos3PDA,
        tokenAVault: vaultE,
        tokenBVault: vaultF,
        tokenAMint: mintE.publicKey,
        tokenBMint: mintF.publicKey,
        owner: user3.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user3])
      .rpc();

    const u3TokenE = await getAssociatedTokenAddress(mintE.publicKey, user3.publicKey);
    const u3TokenF = await getAssociatedTokenAddress(mintF.publicKey, user3.publicKey);

    const ataTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(user3.publicKey, u3TokenE, user3.publicKey, mintE.publicKey),
      createAssociatedTokenAccountInstruction(user3.publicKey, u3TokenF, user3.publicKey, mintF.publicKey)
    );
    await provider.sendAndConfirm(ataTx, [user3]);

    // Protocol is NOT paused — should fail
    try {
      await program.methods
        .emergencyWithdraw()
        .accounts({
          config: configPDA,
          position: pos3PDA,
          vaultTokenA: vaultE,
          vaultTokenB: vaultF,
          userTokenA: u3TokenE,
          userTokenB: u3TokenF,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();
      expect.fail("Should have failed — protocol not paused");
    } catch (error) {
      expect(error.message).to.include("NotPaused");
    }
  });

  // ================================================================
  // 17. UPDATE PARAMS — pause & unpause
  // ================================================================
  it("17. Update Params — pause and unpause protocol", async () => {
    // Pause
    await program.methods
      .updateParams(null, null, null, null, null, true)
      .accounts({ config: configPDA, authority: authority.publicKey })
      .signers([authority])
      .rpc();

    let config = await program.account.strategyConfig.fetch(configPDA);
    expect(config.isPaused).to.be.true;

    // Unpause
    await program.methods
      .updateParams(null, null, null, null, null, false)
      .accounts({ config: configPDA, authority: authority.publicKey })
      .signers([authority])
      .rpc();

    config = await program.account.strategyConfig.fetch(configPDA);
    expect(config.isPaused).to.be.false;
  });

  // ================================================================
  // 18. DEPOSIT BLOCKED — when protocol is paused
  // ================================================================
  it("18. Deposit guard — rejected when protocol is paused", async () => {
    // Create fresh position for paused-deposit test
    const user4 = Keypair.generate();
    const a4 = await provider.connection.requestAirdrop(user4.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(a4);

    const mintG = Keypair.generate();
    const mintH = Keypair.generate();
    const lam = await getMinimumBalanceForRentExemptMint(provider.connection);

    const cMTx = new Transaction().add(
      SystemProgram.createAccount({ fromPubkey: authority.publicKey, newAccountPubkey: mintG.publicKey, space: MINT_SIZE, lamports: lam, programId: TOKEN_PROGRAM_ID }),
      createInitializeMintInstruction(mintG.publicKey, 6, authority.publicKey, null),
      SystemProgram.createAccount({ fromPubkey: authority.publicKey, newAccountPubkey: mintH.publicKey, space: MINT_SIZE, lamports: lam, programId: TOKEN_PROGRAM_ID }),
      createInitializeMintInstruction(mintH.publicKey, 6, authority.publicKey, null)
    );
    await provider.sendAndConfirm(cMTx, [authority, mintG, mintH]);

    const [pos4PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user4.publicKey.toBuffer(), mintG.publicKey.toBuffer(), mintH.publicKey.toBuffer()],
      program.programId
    );
    const [vG] = PublicKey.findProgramAddressSync([Buffer.from("vault_a"), pos4PDA.toBuffer()], program.programId);
    const [vH] = PublicKey.findProgramAddressSync([Buffer.from("vault_b"), pos4PDA.toBuffer()], program.programId);

    await program.methods.createPosition(new BN(REBALANCE_INTERVAL), CENTER_RANGE_BPS, WING_RANGE_BPS)
      .accounts({ config: configPDA, position: pos4PDA, tokenAMint: mintG.publicKey, tokenBMint: mintH.publicKey, owner: user4.publicKey, systemProgram: SystemProgram.programId })
      .signers([user4]).rpc();

    await program.methods.initPositionVaults()
      .accounts({ position: pos4PDA, tokenAVault: vG, tokenBVault: vH, tokenAMint: mintG.publicKey, tokenBMint: mintH.publicKey, owner: user4.publicKey, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId })
      .signers([user4]).rpc();

    const u4tG = await getAssociatedTokenAddress(mintG.publicKey, user4.publicKey);
    const u4tH = await getAssociatedTokenAddress(mintH.publicKey, user4.publicKey);
    const aTx4 = new Transaction().add(
      createAssociatedTokenAccountInstruction(user4.publicKey, u4tG, user4.publicKey, mintG.publicKey),
      createAssociatedTokenAccountInstruction(user4.publicKey, u4tH, user4.publicKey, mintH.publicKey),
      createMintToInstruction(mintG.publicKey, u4tG, authority.publicKey, 100_000_000),
      createMintToInstruction(mintH.publicKey, u4tH, authority.publicKey, 100_000_000)
    );
    await provider.sendAndConfirm(aTx4, [user4, authority]);

    // Pause protocol
    await program.methods.updateParams(null, null, null, null, null, true)
      .accounts({ config: configPDA, authority: authority.publicKey }).signers([authority]).rpc();

    try {
      await program.methods.deposit(new BN(50_000_000), new BN(50_000_000))
        .accounts({
          config: configPDA, position: pos4PDA, vaultTokenA: vG, vaultTokenB: vH,
          userTokenA: u4tG, userTokenB: u4tH, owner: user4.publicKey, tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([user4]).rpc();
      expect.fail("Should have failed — protocol paused");
    } catch (error) {
      expect(error.message).to.include("ConfigInactive");
    }

    // Unpause
    await program.methods.updateParams(null, null, null, null, null, false)
      .accounts({ config: configPDA, authority: authority.publicKey }).signers([authority]).rpc();
  });

  // ================================================================
  // 19. UPDATE PARAMS — unauthorized signer rejected
  // ================================================================
  it("19. Update guard — non-authority rejected", async () => {
    const imposter = Keypair.generate();
    const airdropI = await provider.connection.requestAirdrop(imposter.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropI);

    // imposter tries to derive their own config PDA — which doesn't exist
    const [imposterConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), imposter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .updateParams(9999, null, null, null, null, null)
        .accounts({ config: imposterConfig, authority: imposter.publicKey })
        .signers([imposter])
        .rpc();
      expect.fail("Should have failed — imposter config doesn't exist");
    } catch (error) {
      expect(error.message).to.include("AccountNotInitialized");
    }
  });

  // ================================================================
  // 20. INITIALIZE CONFIG — invalid fee rejected
  // ================================================================
  it("20. Init guard — fee > 10000 rejected", async () => {
    const badAuth = Keypair.generate();
    const airdropB = await provider.connection.requestAirdrop(badAuth.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropB);

    const [badConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), badAuth.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initializeConfig(10001, treasury.publicKey, new BN(900), 50, new BN(60))
        .accounts({ config: badConfig, authority: badAuth.publicKey, systemProgram: SystemProgram.programId })
        .signers([badAuth])
        .rpc();
      expect.fail("Should have failed — fee > 10000");
    } catch (error) {
      expect(error.message).to.include("InvalidFee");
    }
  });

  // ================================================================
  // 21. CREATE POSITION — invalid range rejected
  // ================================================================
  it("21. Position guard — center_range_bps = 0 rejected", async () => {
    const user5 = Keypair.generate();
    const a5 = await provider.connection.requestAirdrop(user5.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(a5);

    const mintI = Keypair.generate();
    const mintJ = Keypair.generate();
    const lamI = await getMinimumBalanceForRentExemptMint(provider.connection);

    const cMTx5 = new Transaction().add(
      SystemProgram.createAccount({ fromPubkey: authority.publicKey, newAccountPubkey: mintI.publicKey, space: MINT_SIZE, lamports: lamI, programId: TOKEN_PROGRAM_ID }),
      createInitializeMintInstruction(mintI.publicKey, 6, authority.publicKey, null),
      SystemProgram.createAccount({ fromPubkey: authority.publicKey, newAccountPubkey: mintJ.publicKey, space: MINT_SIZE, lamports: lamI, programId: TOKEN_PROGRAM_ID }),
      createInitializeMintInstruction(mintJ.publicKey, 6, authority.publicKey, null)
    );
    await provider.sendAndConfirm(cMTx5, [authority, mintI, mintJ]);

    const [pos5PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user5.publicKey.toBuffer(), mintI.publicKey.toBuffer(), mintJ.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .createPosition(new BN(REBALANCE_INTERVAL), 0, WING_RANGE_BPS)
        .accounts({
          config: configPDA,
          position: pos5PDA,
          tokenAMint: mintI.publicKey,
          tokenBMint: mintJ.publicKey,
          owner: user5.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user5])
        .rpc();
      expect.fail("Should have failed — center_range_bps = 0");
    } catch (error) {
      expect(error.message).to.include("InvalidParameter");
    }
  });
});