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
  const [error, setError] = useState<string | null>(null);

  const pairInfo = PAIRS.find((p) => p.id === pair);
  const intervalInfo = REBALANCE_INTERVALS.find((i) => i.value === interval);
  const allChecked = checked.every(Boolean);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Transaction failed. Check your wallet and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-[#10B981]" />
        </div>
        <h2 className="font-manrope text-[24px] font-bold text-white">Position created!</h2>
        <p className="text-[#A3A3A3] text-sm">The keeper will start monitoring and rebalancing your position.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-manrope text-[20px] font-semibold text-white mb-1">Review & confirm</h2>
        <p className="text-sm text-[#A3A3A3]">Acknowledge the risks and sign to create your position.</p>
      </div>

      {/* Summary */}
      <div className="bg-[#0A0A0A] border border-[#3c4a42] rounded-xl divide-y divide-[#262626]">
        {[
          { label: 'Pair', value: pairInfo ? `${pairInfo.tokenA}/${pairInfo.tokenB}` : pair },
          { label: 'Deposit (Token A)', value: `${amount.toLocaleString()} USDC` },
          { label: 'Rebalance every', value: intervalInfo?.label ?? `${interval} min` },
          { label: 'Strategy', value: '80/10/10 Concentrated' },
          { label: 'Platform fee', value: '10% of earned yield' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-[#A3A3A3]">{row.label}</span>
            <span className="font-medium text-white">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Risk checklist */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#F59E0B] mb-3">
          <AlertTriangle size={13} />
          <span>Please read and acknowledge each item</span>
        </div>
        {RISKS.map((risk, i) => (
          <label
            key={i}
            className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checked[i]
                ? 'border-[#4edea3]/40 bg-[#4edea3]/5'
                : 'border-[#3c4a42] bg-[#0A0A0A]'
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
              className="mt-0.5 accent-[#10B981]"
            />
            <span className="text-xs text-[#A3A3A3] leading-relaxed">{risk}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!allChecked || loading}
        className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#0da06f] disabled:opacity-40 disabled:cursor-not-allowed text-black font-manrope font-bold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin text-black" /> Creating position...</>
        ) : (
          'Sign & Create Position'
        )}
      </button>
    </div>
  );
}
