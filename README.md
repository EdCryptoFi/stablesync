# StableSync

Automated concentrated liquidity management for stablecoin pairs on Solana — non-custodial, set and forget.

## What it does

Stablecoin LPs on Solana lose money when their position drifts out of range and stops earning fees. StableSync automates the rebalancing using **session key delegation**: the keeper can rebalance your position without ever having custody of your funds.

- Deposit into a USDC/USDT or USDC/USDS strategy
- Delegate a narrow rebalancing permission via session key
- Keeper monitors price via Pyth oracle and repositions automatically
- Withdraw at any time — you stay in control

## Smart Contract

**Deployed on Solana devnet:** `7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6`

Built with Anchor 0.31.1 + Orca Whirlpools + Pyth Network.

Core instructions:
- `initialize_config` — deploy strategy parameters
- `create_position` — deposit and open concentrated liquidity position
- `rebalance` — reposition liquidity (callable only by delegated session key)
- `emergency_withdraw` — user-only full withdrawal at any time

## Stack

- **Smart contract:** Rust, Anchor 0.31.1, Orca Whirlpools, Pyth Network
- **Frontend:** Next.js 14, Tailwind CSS, @solana/wallet-adapter
- **Keeper agent:** TypeScript, Solana web3.js

## Running locally

```bash
# Frontend
cd frontend
npm install
npm run dev
```

```bash
# Smart contract tests
cd program
anchor test
```

## Built for

[Colosseum Solana Frontier Hackathon](https://arena.colosseum.org/frontier) — May 2026

Follow: [@Stable_Sync](https://x.com/Stable_Sync)
