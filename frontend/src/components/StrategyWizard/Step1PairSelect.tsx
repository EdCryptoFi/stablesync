'use client';

import { PAIRS } from '@/lib/constants';
import { Shield, Zap, RefreshCw } from 'lucide-react';

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
}

export function Step1PairSelect({ selected, onSelect }: Props) {
  const selectedPair = PAIRS.find((p) => p.id === selected);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Choose your pair</h2>
        <p className="text-sm text-gray-400">Select a stablecoin pair to provide liquidity for.</p>
      </div>

      <div className="grid gap-3">
        {PAIRS.map((pair) => (
          <button
            key={pair.id}
            onClick={() => onSelect(pair.id)}
            className={`flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all ${
              selected === pair.id
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-surface-600 bg-surface-800 hover:border-surface-500'
            }`}
          >
            <div className="flex -space-x-2">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold border-2 border-surface-800 z-10">
                {pair.tokenA.slice(0, 2)}
              </div>
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold border-2 border-surface-800">
                {pair.tokenB.slice(0, 2)}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold">{pair.tokenA}/{pair.tokenB}</div>
              <div className="text-xs text-gray-400 mt-0.5">{pair.description}</div>
            </div>
            <div className="text-right">
              <div className="text-brand-400 font-semibold">{pair.avgApy}</div>
              <div className="text-xs text-gray-500">avg APY</div>
            </div>
          </button>
        ))}
      </div>

      {/* Strategy details panel */}
      {selectedPair && (
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">How StableSync manages this position</h3>

          {/* Range allocation visual */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-1">Range allocation</div>
            <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
              <div className="bg-brand-600 flex items-center justify-center text-xs text-white font-medium" style={{ width: '10%' }}>
                10%
              </div>
              <div className="bg-brand-500 flex items-center justify-center text-xs text-white font-semibold flex-1">
                80% center ±0.025%
              </div>
              <div className="bg-brand-600 flex items-center justify-center text-xs text-white font-medium" style={{ width: '10%' }}>
                10%
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>lower wing ±0.075%</span>
              <span>tight range (max fees)</span>
              <span>upper wing ±0.075%</span>
            </div>
          </div>

          {/* Key properties */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <Shield size={13} className="text-brand-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">Non-custodial</div>
                <div className="text-xs text-gray-400">Session key delegates only rebalance permission</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap size={13} className="text-brand-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">Auto-rebalance</div>
                <div className="text-xs text-gray-400">Keeper repositions when price exits center band</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw size={13} className="text-brand-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">On-chain logs</div>
                <div className="text-xs text-gray-400">Every rebalance recorded as a PDA</div>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-surface-600 text-xs text-gray-500">
            Platform fee: <span className="text-white">10% of earned yield only</span> — no fee on deposits or withdrawals.
          </div>
        </div>
      )}
    </div>
  );
}
