'use client';

import { useState, useEffect } from 'react';
import { fetchOrcaPools, OrcaPoolData } from '@/lib/orcaApi';
import { PAIRS } from '@/lib/constants';

type PoolMap = Record<string, OrcaPoolData | null>;

export function useOrcaPools() {
  const [pools, setPools] = useState<PoolMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const addresses = PAIRS
        .filter((p) => p.orcaPoolAddress)
        .map((p) => p.orcaPoolAddress as string);

      if (addresses.length === 0) {
        setLoading(false);
        return;
      }

      const result = await fetchOrcaPools(addresses);
      if (!cancelled) {
        // Re-key by pair id
        const byPairId: PoolMap = {};
        PAIRS.forEach((p) => {
          if (p.orcaPoolAddress) {
            byPairId[p.id] = result[p.orcaPoolAddress] ?? null;
          }
        });
        setPools(byPairId);
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { pools, loading };
}
