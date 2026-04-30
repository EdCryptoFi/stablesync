# Project Guidelines

## Code Style
- Use Rust for smart contracts with Anchor framework, following Solana best practices
- TypeScript for frontend components with Next.js and Solana Wallet Adapter
- Consistent naming: PascalCase for structs/enums, snake_case for functions/variables

## Architecture
StableSync is a Solana DeFi SaaS for concentrated stablecoin liquidity with automatic rebalancing. The project consists of 5 modules:

1. **On-Chain**: Smart contract in Rust + Anchor
2. **Keeper**: Auto-rebalance agent in Rust/Node.js + Helius
3. **Frontend**: User dashboard in Next.js + TradingView
4. **Analytics**: Metrics & admin in TimescaleDB + Metabase
5. **Deploy/Test**: CI/CD & security in GitHub Actions

See [S1](S1) for project overview, [S2.txt](S2.txt) to [S7.txt](S7.txt) for detailed module requirements.

## Build and Test
- Smart contract: `anchor build` to compile, `anchor test` for unit tests
- Frontend: `npm install` for dependencies, `npm run dev` for development server
- Deploy to Solana devnet/testnet for integration testing
- Use Helius RPC for reliable Solana connections

## Conventions
- Implement session key delegation for keeper automation without custody
- Use circuit-breakers for emergency withdrawals
- Follow Anchor security guidelines and Pyth oracle integration
- Position allocation: 80% center ±0.025%, 10% upper/lower wings
- Rebalancing triggers: timer-based (min 15min) + price monitoring

Since the Qwen VS Code extension is configured, leverage it for AI-assisted code generation, particularly for Rust/Anchor smart contract development and TypeScript frontend scaffolding.</content>
<parameter name="filePath">/Users/fabioalves/Desktop/VibeCode/StableSync/AGENTS.md