'use client';

import { useEffect, useState } from 'react';
import { fetchOrcaPool, OrcaPoolData } from '@/lib/orcaApi';
import { TrendingUp, RefreshCw, DollarSign } from 'lucide-react';

const USDC_USDT_POOL = '4fuUiYxTQ6QCrdSq9ouBYcTM7bqSwYTSyLueGZLTy4T4';

export function OrcaLiveStats() {
  const [data, setData] = useState<OrcaPoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchOrcaPool(USDC_USDT_POOL);
      if (!cancelled) {
        setData(result);
        setLoading(false);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const stats = data
    ? [
        {
          icon: TrendingUp,
          label: 'Avg APY Range',
          value: '8% — 14%',
          sub: `Pool fee: ${data.feeRatePct.toFixed(2)}% · TVL $${(data.tvlUsdc / 1_000).toFixed(0)}K`,
          live: true,
        },
        {
          icon: RefreshCw,
          label: 'Min Rebalance',
          value: '15 Min',
          sub: `USDC/USDT @ $${data.price.toFixed(5)}`,
          live: true,
        },
        {
          icon: DollarSign,
          label: 'Platform Fee',
          value: '10% of yield',
          sub: 'No deposit or withdrawal fee',
          live: false,
        },
      ]
    : [
        { icon: TrendingUp, label: 'Avg APY Range',  value: '8% — 14%', sub: 'Based on Orca USDC/USDT pool', live: false },
        { icon: RefreshCw,  label: 'Min Rebalance',  value: '15 Min',    sub: 'Configurable up to 1 hour',    live: false },
        { icon: DollarSign, label: 'Platform Fee',   value: '10% of yield', sub: 'No deposit or withdrawal fee', live: false },
      ];

  return (
    <section className="max-w-[1200px] mx-auto px-8 pb-[80px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div key={stat.label}
            className="bg-[#171717] border border-[#262626] hover:border-[#3c4a42] p-6 rounded-xl transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
                    <stat.icon size={15} className="text-[#10B981]" />
                  </div>
                  <span className="text-xs tracking-[0.06em] font-semibold uppercase text-[#A3A3A3] font-manrope">
                    {stat.label}
                  </span>
                </div>
                {stat.live && !loading && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="font-manrope text-[32px] leading-none font-bold text-white mb-1">{stat.value}</div>
              {stat.sub && (
                <div className="text-xs text-[#A3A3A3] mt-2 font-mono">{stat.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {data && lastUpdated && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#A3A3A3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Live data from Orca mainnet · Updated {lastUpdated}
        </div>
      )}
    </section>
  );
}
