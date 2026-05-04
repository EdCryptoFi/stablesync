'use client';

import { PAIRS } from '@/lib/constants';
import { Shield, Zap, RefreshCw, Activity } from 'lucide-react';
import { useOrcaPools } from '@/hooks/useOrcaPools';
import type { OrcaPoolData } from '@/lib/orcaApi';

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-1.5 py-0.5 rounded-full">
      <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
      Live
    </span>
  );
}

function PoolStats({ data }: { data: OrcaPoolData }) {
  return (
    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#262626]">
      <div>
        <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-0.5">Price</div>
        <div className="text-sm font-bold text-white font-manrope">${data.price.toFixed(5)}</div>
      </div>
      <div>
        <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-0.5">Fee Tier</div>
        <div className="text-sm font-bold text-white font-manrope">{data.feeRatePct.toFixed(2)}%</div>
      </div>
      <div>
        <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-0.5">TVL</div>
        <div className="text-sm font-bold text-white font-manrope">
          ${data.tvlUsdc >= 1_000_000
            ? `${(data.tvlUsdc / 1_000_000).toFixed(2)}M`
            : `${(data.tvlUsdc / 1_000).toFixed(0)}K`}
        </div>
      </div>
    </div>
  );
}

export function Step1PairSelect({ selected, onSelect }: Props) {
  const selectedPair = PAIRS.find((p) => p.id === selected);
  const { pools, loading } = useOrcaPools();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-manrope text-[20px] font-semibold text-white mb-1">Choose your pair</h2>
        <p className="text-sm text-[#A3A3A3]">Select a stablecoin pair to provide liquidity for.</p>
      </div>

      <div className="grid gap-3">
        {PAIRS.map((pair) => {
          const liveData = pools[pair.id];
          const hasLive = !!liveData;

          return (
            <button
              key={pair.id}
              onClick={() => onSelect(pair.id)}
              className={`flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all ${
                selected === pair.id
                  ? 'border-[#4edea3] bg-[#4edea3]/10'
                  : 'border-[#3c4a42] bg-[#0A0A0A] hover:border-[#4edea3]/50'
              }`}
            >
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold border-2 border-[#171717] z-10 text-white">
                  {pair.tokenA.slice(0, 2)}
                </div>
                <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-xs font-bold border-2 border-[#171717] text-black">
                  {pair.tokenB.slice(0, 2)}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-manrope font-semibold text-white">{pair.tokenA}/{pair.tokenB}</span>
                  {hasLive && <LiveBadge />}
                </div>
                <div className="text-xs text-[#A3A3A3] mt-0.5">{pair.description}</div>
              </div>
              <div className="text-right shrink-0">
                {hasLive ? (
                  <>
                    <div className="text-[#4edea3] font-semibold font-manrope text-sm">
                      ${liveData.price.toFixed(4)}
                    </div>
                    <div className="text-xs text-[#A3A3A3]">current price</div>
                  </>
                ) : (
                  <>
                    <div className="text-[#4edea3] font-semibold font-manrope">{pair.avgApy}</div>
                    <div className="text-xs text-[#A3A3A3]">avg APY</div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPair && (
        <div className="bg-[#0A0A0A] border border-[#3c4a42] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-manrope font-semibold text-white">How StableSync manages this position</h3>
            {pools[selectedPair.id] && (
              <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                <Activity size={11} className="text-[#10B981]" />
                <span>Orca mainnet reference</span>
              </div>
            )}
          </div>

          {/* Live pool stats */}
          {pools[selectedPair.id] && <PoolStats data={pools[selectedPair.id]!} />}
          {loading && !pools[selectedPair.id] && (
            <div className="flex items-center gap-2 text-xs text-[#A3A3A3] pt-2 border-t border-[#262626]">
              <span className="w-3 h-3 border border-[#A3A3A3]/40 border-t-[#4edea3] rounded-full animate-spin" />
              Fetching live pool data…
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs text-[#A3A3A3] mb-1">Range allocation</div>
            <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
              <div className="bg-[#0da06f] flex items-center justify-center text-xs text-black font-semibold" style={{ width: '10%' }}>
                10%
              </div>
              <div className="bg-[#10B981] flex items-center justify-center text-xs text-black font-semibold flex-1">
                80% center ±0.025%
              </div>
              <div className="bg-[#0da06f] flex items-center justify-center text-xs text-black font-semibold" style={{ width: '10%' }}>
                10%
              </div>
            </div>
            <div className="flex justify-between text-xs text-[#A3A3A3]">
              <span>lower wing ±0.075%</span>
              <span>tight range (max fees)</span>
              <span>upper wing ±0.075%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <Shield size={13} className="text-[#4edea3] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">Non-custodial</div>
                <div className="text-xs text-[#A3A3A3]">Session key delegates only rebalance permission</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap size={13} className="text-[#4edea3] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">Auto-rebalance</div>
                <div className="text-xs text-[#A3A3A3]">Keeper repositions when price exits center band</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw size={13} className="text-[#4edea3] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">On-chain logs</div>
                <div className="text-xs text-[#A3A3A3]">Every rebalance recorded as a PDA</div>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-[#3c4a42] text-xs text-[#A3A3A3]">
            Platform fee: <span className="text-white">10% of earned yield only</span> — no fee on deposits or withdrawals.
          </div>
        </div>
      )}
    </div>
  );
}
