export const PROGRAM_ID = '7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6';
export const DEPLOYER_PUBKEY = '7EBg9nwJspxwnr86WRhKzqXSLAybhrDUDxxPSCqctuhL';

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com';

// Devnet test tokens (replace with mainnet addresses for production)
export const PAIRS = [
  {
    id: 'USDC/USDT',
    tokenA: 'USDC',
    tokenB: 'USDT',
    description: 'Most liquid stablecoin pair on Orca Devnet',
    avgApy: '8–12%',
    mintA: 'BZCSMV4ZaBMSUZnojhCnhYE5R919YN2b4U39JVEjnQzs',
    mintB: '2KrpCa2VCa9M1LVJn9Re43fyjVPCBgtUu87Z4kGdebvr',
  },
  {
    id: 'USDC/USDS',
    tokenA: 'USDC',
    tokenB: 'USDS',
    description: 'Emerging pair — lower liquidity, higher spread',
    avgApy: '10–16%',
    mintA: 'BZCSMV4ZaBMSUZnojhCnhYE5R919YN2b4U39JVEjnQzs',
    mintB: 'HKgm8LzDNAk3skpu5yQYUjEfdSrkNX4Vsh3xPEQmD6fT',
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
