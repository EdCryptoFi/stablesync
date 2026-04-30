'use client';

import { PAIRS } from '@/lib/constants';

interface Props {
  selected: string;
  onSelect: (pair: string) => void;
}

export function Step1PairSelect({ selected, onSelect }: Props) {
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
      <div className="bg-surface-700 rounded-lg p-3 text-xs text-gray-400 leading-relaxed">
        Positions use an 80/10/10 range split: 80% in a tight center band (±0.025%) and 10% each in upper/lower wings for wider coverage.
      </div>
    </div>
  );
}
