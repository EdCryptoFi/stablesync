export const PROGRAM_ID = '7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6';

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com';

export const PAIRS = [
  {
    id: 'USDC/USDT',
    tokenA: 'USDC',
    tokenB: 'USDT',
    description: 'Most liquid stablecoin pair on Orca Devnet',
    avgApy: '8–12%',
    mintA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    mintB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
  {
    id: 'USDC/USDS',
    tokenA: 'USDC',
    tokenB: 'USDS',
    description: 'Emerging pair — lower liquidity, higher spread',
    avgApy: '10–16%',
    mintA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    mintB: 'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA',
  },
];

export const REBALANCE_INTERVALS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
];

export const CENTER_RANGE_BPS = 25;    // ±0.025%
export const WING_RANGE_BPS = 75;     // 0.075% each side from center edge
export const CENTER_ALLOCATION = 0.80;
export const WING_ALLOCATION = 0.10;
