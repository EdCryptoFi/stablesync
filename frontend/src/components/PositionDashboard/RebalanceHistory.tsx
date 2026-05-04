'use client';

import { RefreshCw, ExternalLink, Clock, TrendingUp } from 'lucide-react';

export interface RebalanceEvent {
  id: string;
  timestamp: string;
  trigger: 'timer' | 'price';
  newCenterPrice: number;
  yield: number;
  feeCost: number;
  txSig: string;
}

interface Props {
  events: RebalanceEvent[];
}

export function RebalanceHistory({ events }: Props) {
  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#262626] flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
          <RefreshCw size={12} className="text-[#10B981]" />
        </div>
        <span className="font-semibold text-sm text-white font-manrope">Rebalance history</span>
        {events.length > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-2 py-0.5 rounded-full">
            {events.length} events
          </span>
        )}
      </div>
      {events.length === 0 ? (
        <div className="py-12 text-center">
          <RefreshCw size={20} className="text-[#A3A3A3] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[#A3A3A3]">No rebalances yet. The keeper is monitoring...</p>
        </div>
      ) : (
        <div className="divide-y divide-[#262626]">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#1d1d1d] transition-colors group">
              {/* Trigger badge */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                e.trigger === 'timer'
                  ? 'bg-[#10B981]/15 text-[#10B981]'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B]'
              }`}>
                {e.trigger === 'timer' ? <Clock size={9} /> : <TrendingUp size={9} />}
                {e.trigger}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white font-manrope">{e.timestamp}</div>
                <div className="text-xs text-[#A3A3A3] mt-0.5">
                  center @ <span className="text-white font-mono">{e.newCenterPrice.toFixed(5)}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-[#4edea3] font-manrope">+${e.yield.toFixed(4)}</div>
                <div className="text-xs text-[#A3A3A3]">-${e.feeCost.toFixed(4)} SOL</div>
              </div>

              <a href={`https://solscan.io/tx/${e.txSig}`} target="_blank" rel="noopener noreferrer"
                className="text-[#3c4a42] hover:text-[#4edea3] transition-colors group-hover:text-[#A3A3A3]">
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
