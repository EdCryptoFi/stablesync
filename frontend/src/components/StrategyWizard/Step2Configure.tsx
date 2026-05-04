'use client';

import { REBALANCE_INTERVALS } from '@/lib/constants';
import Link from 'next/link';

interface Props {
  amount: number;
  interval: number;
  maxAmount: number;
  onAmountChange: (v: number) => void;
  onIntervalChange: (v: number) => void;
}

const MIN = 1;

export function Step2Configure({ amount, interval, maxAmount, onAmountChange, onIntervalChange }: Props) {
  const MAX = Math.max(MIN, maxAmount);
  const projectedDailyYield = ((amount * 0.10) / 365).toFixed(4);
  const projectedMonthlyYield = ((amount * 0.10) / 12).toFixed(2);
  const pct = MAX > MIN ? ((amount - MIN) / (MAX - MIN)) * 100 : 0;
  const noFunds = maxAmount < MIN;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-manrope text-[20px] font-semibold text-white mb-1">Configure your position</h2>
        <p className="text-sm text-[#A3A3A3]">Set how much to deposit and how often to rebalance.</p>
      </div>

      {noFunds && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 text-sm">
          <div className="text-[#F59E0B] font-semibold mb-1">No vault balance</div>
          <div className="text-[#A3A3A3]">
            You need to deposit funds in the{' '}
            <Link href="/app/vault" className="text-[#4edea3] hover:underline">Vault</Link>{' '}
            before allocating to a strategy.
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-[#A3A3A3]">Deposit amount</label>
          <span className="text-[#4edea3] font-manrope font-semibold">${amount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={Math.min(amount, MAX)}
          disabled={noFunds}
          onChange={(e) => {
            const v = Number(e.target.value);
            onAmountChange(Number.isFinite(v) ? Math.min(MAX, Math.max(MIN, v)) : MIN);
          }}
          className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #10B981 ${pct}%, #262626 0%)`,
          }}
        />
        <div className="flex justify-between text-xs text-[#A3A3A3] mt-1">
          <span>${MIN}</span>
          <span className="text-[#4edea3] font-medium">Max: ${MAX.toLocaleString()} (vault)</span>
        </div>
      </div>

      {/* Interval */}
      <div>
        <label className="text-sm font-medium text-[#A3A3A3] mb-2 block">Rebalance interval</label>
        <div className="grid grid-cols-3 gap-2">
          {REBALANCE_INTERVALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onIntervalChange(opt.value)}
              className={`py-2.5 rounded-lg border text-sm font-manrope font-medium transition-all ${
                interval === opt.value
                  ? 'border-[#4edea3] bg-[#4edea3]/10 text-[#4edea3]'
                  : 'border-[#3c4a42] bg-[#0A0A0A] text-[#A3A3A3] hover:border-[#4edea3]/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#A3A3A3] mt-2">
          {interval <= 15
            ? 'Higher frequency → more fee capture, more SOL costs'
            : interval <= 30
            ? 'Balanced: moderate yield with reasonable gas costs'
            : 'Conservative: lower frequency, lowest SOL overhead'}
        </p>
      </div>

      {/* Projection */}
      <div className="bg-[#0A0A0A] border border-[#3c4a42] rounded-xl p-4">
        <div className="text-xs text-[#A3A3A3] mb-3 font-manrope font-semibold uppercase tracking-wider">
          Estimated yield (10% APY)
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-manrope text-[24px] font-bold text-[#4edea3]">${projectedDailyYield}</div>
            <div className="text-xs text-[#A3A3A3]">per day</div>
          </div>
          <div>
            <div className="font-manrope text-[24px] font-bold text-[#4edea3]">${projectedMonthlyYield}</div>
            <div className="text-xs text-[#A3A3A3]">per month</div>
          </div>
        </div>
        <p className="text-xs text-[#A3A3A3] mt-3">
          * Estimates based on historical Orca pool data. Not financial advice.
        </p>
      </div>

      {/* Range visual */}
      <div className="bg-[#0A0A0A] border border-[#3c4a42] rounded-xl p-4">
        <div className="text-xs text-[#A3A3A3] mb-3 font-medium">Position range allocation</div>
        <div className="flex rounded-lg overflow-hidden h-7 text-xs font-semibold">
          <div className="bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3] border-r border-[#0A0A0A]" style={{ width: '10%' }}>10%</div>
          <div className="bg-[#10B981]/30 flex items-center justify-center text-[#10B981] flex-1 border-r border-[#0A0A0A]">80% Center ±0.025%</div>
          <div className="bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3]" style={{ width: '10%' }}>10%</div>
        </div>
        <div className="flex justify-between text-xs text-[#A3A3A3] mt-1.5">
          <span>Lower wing</span>
          <span>Upper wing</span>
        </div>
      </div>
    </div>
  );
}
