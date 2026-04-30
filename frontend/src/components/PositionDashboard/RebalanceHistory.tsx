'use client';

import { RefreshCw, ExternalLink } from 'lucide-react';

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
    <div className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-700 flex items-center gap-2">
        <RefreshCw size={14} className="text-brand-500" />
        <span className="font-semibold text-sm">Rebalance history</span>
        <span className="ml-auto text-xs text-gray-500">{events.length} total</span>
      </div>
      {events.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">No rebalances yet. The keeper is monitoring...</div>
      ) : (
        <div className="divide-y divide-surface-700">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-700/50 transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${e.trigger === 'timer' ? 'bg-brand-500' : 'bg-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{e.timestamp}</div>
                <div className="text-xs text-gray-400">
                  {e.trigger === 'timer' ? 'Timer trigger' : 'Price trigger'} · center @ {e.newCenterPrice.toFixed(5)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-brand-400">+${e.yield.toFixed(4)}</div>
                <div className="text-xs text-gray-500">-${e.feeCost.toFixed(4)} SOL</div>
              </div>
              <a
                href={`https://solscan.io/tx/${e.txSig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
