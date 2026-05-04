const ORCA_API = 'https://api.orca.so/v2/solana';

export interface OrcaPoolData {
  address: string;
  price: number;
  feeRateBps: number;
  feeRatePct: number;
  tvlUsdc: number;
  /** Raw 24h yield/TVL annualized as percentage. Represents the full pool — concentrated positions earn more. */
  apr24hRaw: number;
}

interface OrcaPoolResponse {
  price?: string;
  feeRate?: number;
  tvlUsdc?: string;
  yieldOverTvl_24h?: string;
  data?: {
    price?: string;
    feeRate?: number;
    tvlUsdc?: string;
    yieldOverTvl_24h?: string;
  };
}

export async function fetchOrcaPool(poolAddress: string): Promise<OrcaPoolData | null> {
  try {
    const res = await fetch(`${ORCA_API}/pools/${poolAddress}`, {
      next: { revalidate: 60 },
    } as RequestInit);
    if (!res.ok) return null;
    const json: OrcaPoolResponse = await res.json();
    const d = json.data ?? json;
    return {
      address: poolAddress,
      price: parseFloat(d.price ?? '1'),
      feeRateBps: d.feeRate ?? 100,
      feeRatePct: (d.feeRate ?? 100) / 10_000,
      tvlUsdc: parseFloat(d.tvlUsdc ?? '0'),
      apr24hRaw: parseFloat(d.yieldOverTvl_24h ?? '0') * 365 * 100,
    };
  } catch {
    return null;
  }
}

export async function fetchOrcaPools(addresses: string[]): Promise<Record<string, OrcaPoolData | null>> {
  const results = await Promise.all(addresses.map((a) => fetchOrcaPool(a)));
  return Object.fromEntries(addresses.map((a, i) => [a, results[i]]));
}
