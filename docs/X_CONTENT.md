# StableSync — Conteúdo para conta X (@stablesync_sol)

## Bio
Automated stablecoin liquidity on Solana | Non-custodial | Built on @orca_so + @PythNetwork | @ColosseumHQ Frontier Hackathon

## Thread de lançamento (Dia 1 — hoje, 29 Apr)

### Tweet 1/8 (pin este)
We're building StableSync for @ColosseumHQ Frontier Hackathon 🌊

Automated stablecoin LP management on Solana — non-custodial, timer-driven, built on @orca_so.

Here's the full story 🧵

### Tweet 2/8
LPs lose money in two ways:

1. Impermanent loss when price drifts out of range
2. Forgetting to rebalance (or not having time to)

For stablecoins on concentrated DEXs, a 0.05% price move can kick you out of your range entirely.

StableSync fixes this automatically.

### Tweet 3/8
How it works:

→ You deposit USDC/USDT into StableSync
→ We create a concentrated position on @orca_so with an 80/10/10 range split
→ A keeper agent monitors price via @PythNetwork
→ When the timer fires or price drifts — it rebalances automatically

You do nothing. You keep everything.

### Tweet 4/8
The key innovation: session keys 🔑

The keeper signs rebalance transactions using a delegated session key.

This means:
✅ Keeper can rebalance for you
✅ Keeper CANNOT move your tokens elsewhere
✅ You can revoke access at any time
✅ 100% non-custodial

### Tweet 5/8
The 80/10/10 strategy:

[diagram description: center bar 80% labeled "±0.025% — maximum fee capture", two wing bars 10% each]

80% sits in the tightest range — earns the most fees
10% each in wider wings — catches price during rebalances

When price exits wings → keeper recenters everything.

### Tweet 6/8
Why Solana?

- Sub-second finality means rebalances don't miss price windows
- ~$0.0001 per tx → frequent rebalancing is actually economical
- @orca_so has the deepest stablecoin concentrated liquidity
- @PythNetwork gives real-time oracle data on-chain

Ethereum couldn't do this at the same cost.

### Tweet 7/8
Smart contract is live on Solana devnet:
7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6

- 10 instructions (deposit, rebalance, session delegation, emergency pause...)
- Immutable rebalance logs on-chain
- Security audit done ✅

Frontend coming in 2 days. Testnet link incoming.

### Tweet 8/8
Building this for @ColosseumHQ Frontier Hackathon.

Deadline: May 11.

If you're a DeFi LP who's lost money to impermanent loss or missed rebalances — we're building this for you.

Follow for daily updates. Testnet goes live this week.

---

## Posts diários (schedule)

### Dia 3 (1 Mai) — Thread educacional
**"Why stablecoin LPs lose money (and how to fix it)"**

Stablecoin LPs think they're "safe" because prices don't move much.

But concentrated liquidity is different.

A 0.04% price drift puts you out of range. That means:
- You stop earning fees
- Your position is 100% in one token
- You have to manually rebalance (or lose)

This happens more often than you think.

→ USDT briefly depegged 0.07% in March
→ USDC had a $0.998 moment in 2023
→ New stablecoin launches create temporary pressure

StableSync monitors these moves 24/7 and rebalances before you lose.

### Dia 5 (3 Mai) — Demo post
[record a gif of: connecting Phantom wallet → setup wizard step 1 → choosing USDC/USDT]

"Connect. Choose a pair. Set your interval. That's it."

Testnet is live. Link in bio.

Built in 5 days with @ColosseumHQ Copilot helping us move faster.

### Dia 7 (5 Mai) — Técnico
**"How session keys work in StableSync"**

Most "automated" DeFi vaults require you to give up custody.

We don't.

Using Solana's account model, we create a SessionKey PDA that:
1. Delegates rebalance permission to our keeper
2. Expires automatically after a set time
3. Can be revoked instantly
4. Cannot be used to withdraw your tokens

The keeper signs with this key. Your tokens never leave your position.

Code: [link to GitHub]

### Dia 9 (7 Mai) — Milestone
"First keeper rebalance on testnet 🎉"

[screen recording of keeper log + Solscan tx]

Price moved 0.03% out of range.
Keeper detected it in <15 seconds.
Rebalanced in 1 transaction.
Position recentered.

Total cost: $0.0001

This is what automated LP management looks like on Solana.

### Dia 11 (9 Mai) — Submission
"Submitted to @ColosseumHQ Frontier Hackathon ✅

What we built in 5 weeks:
→ Anchor smart contract (10 instructions, session keys, Pyth oracle)
→ Next.js frontend with setup wizard + position dashboard
→ Keeper agent with timer + price triggers
→ Non-custodial architecture from day 1

Building a real company on this. Follow along."

---

## Hashtags recomendadas
#Solana #DeFi #LiquidityProviding #ColosseumHackathon #BuildOnSolana #OrcaProtocol

## Contas para engajar
- @colosseum — reply nos posts deles
- @orca_so — tag quando mencionar pools
- @PythNetwork — tag quando falar de oracle
- @solana — hashtag #BuildOnSolana
- @helius_dev — se usar Helius RPC
- Outros participantes do hackathon — engage genuinamente
