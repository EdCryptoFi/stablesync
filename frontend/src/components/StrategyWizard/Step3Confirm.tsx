'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { PAIRS, REBALANCE_INTERVALS } from '@/lib/constants';

interface Props {
  pair: string;
  amount: number;
  interval: number;
  onConfirm: () => Promise<void>;
}

const RISKS = [
  'I understand that concentrated liquidity positions can lose value due to impermanent loss.',
  'I understand that the keeper rebalances using a session key, but never has custody of my tokens.',
  'I understand that SOL fees are paid per rebalance and will be deducted from my wallet.',
  'I have read the documentation and understand the 80/10/10 range strategy.',
];

export function Step3Confirm({ pair, amount, interval, onConfirm }: Props) {
  const [checked, setChecked] = useState<boolean[]>(RISKS.map(() => false));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pairInfo = PAIRS.find((p) => p.id === pair);
  const intervalInfo = REBALANCE_INTERVALS.find((i) => i.value === interval);
  const allChecked = checked.every(Boolean);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold">Position created!</h2>
        <p className="text-gray-400 text-sm">The keeper will start monitoring and rebalancing your position.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review & confirm</h2>
        <p className="text-sm text-gray-400">Acknowledge the risks and sign to create your position.</p>
      </div>

      {/* Summary */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl divide-y divide-surface-700">
        {[
          { label: 'Pair', value: pairInfo ? `${pairInfo.tokenA}/${pairInfo.tokenB}` : pair },
          { label: 'Deposit', value: `$${amount.toLocaleString()} USDC` },
          { label: 'Rebalance every', value: intervalInfo?.label ?? `${interval} min` },
          { label: 'Strategy', value: '80/10/10 Concentrated' },
          { label: 'Platform fee', value: '0.2% of earned fees' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-400">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Risk checklist */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-yellow-400 mb-3">
          <AlertTriangle size={13} />
          <span>Please read and acknowledge each item</span>
        </div>
        {RISKS.map((risk, i) => (
          <label
            key={i}
            className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checked[i] ? 'border-brand-500/40 bg-brand-500/5' : 'border-surface-600 bg-surface-800'
            }`}
          >
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked];
                next[i] = e.target.checked;
                setChecked(next);
              }}
              className="mt-0.5 accent-green-500"
            />
            <span className="text-xs text-gray-300 leading-relaxed">{risk}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!allChecked || loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Creating position...</>
        ) : (
          'Sign & Create Position'
        )}
      </button>
    </div>
  );
}
