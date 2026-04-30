'use client';

import { REBALANCE_INTERVALS } from '@/lib/constants';

interface Props {
  amount: number;
  interval: number;
  onAmountChange: (v: number) => void;
  onIntervalChange: (v: number) => void;
}

const MIN = 100;
const MAX = 1000;

export function Step2Configure({ amount, interval, onAmountChange, onIntervalChange }: Props) {
  const projectedDailyYield = ((amount * 0.10) / 365).toFixed(2);
  const projectedMonthlyYield = ((amount * 0.10) / 12).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Configure your position</h2>
        <p className="text-sm text-gray-400">Set how much to deposit and how often to rebalance.</p>
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">Deposit amount</label>
          <span className="text-brand-400 font-semibold">${amount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={50}
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22c55e ${((amount - MIN) / (MAX - MIN)) * 100}%, #1e2e24 0%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>${MIN}</span>
          <span>${MAX}</span>
        </div>
      </div>

      {/* Interval */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Rebalance interval</label>
        <div className="grid grid-cols-3 gap-2">
          {REBALANCE_INTERVALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onIntervalChange(opt.value)}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                interval === opt.value
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-surface-600 bg-surface-800 text-gray-400 hover:border-surface-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {interval <= 15 ? 'Higher frequency → more fee capture, more SOL costs' :
           interval <= 30 ? 'Balanced: moderate yield with reasonable gas costs' :
           'Conservative: lower frequency, lowest SOL overhead'}
        </p>
      </div>

      {/* Projection */}
      <div className="bg-surface-700 border border-surface-600 rounded-xl p-4">
        <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Estimated yield (10% APY)</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xl font-bold text-brand-400">${projectedDailyYield}</div>
            <div className="text-xs text-gray-500">per day</div>
          </div>
          <div>
            <div className="text-xl font-bold text-brand-400">${projectedMonthlyYield}</div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">* Estimates based on historical Orca pool data. Not financial advice.</p>
      </div>

      {/* Range visual */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl p-4">
        <div className="text-xs text-gray-400 mb-3 font-medium">Position range allocation</div>
        <div className="flex rounded-lg overflow-hidden h-7 text-xs font-medium">
          <div className="bg-blue-600/40 flex items-center justify-center text-blue-300 border-r border-surface-900" style={{ width: '10%' }}>10%</div>
          <div className="bg-brand-500/30 flex items-center justify-center text-brand-300 flex-1 border-r border-surface-900">80% Center ±0.025%</div>
          <div className="bg-blue-600/40 flex items-center justify-center text-blue-300" style={{ width: '10%' }}>10%</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span>Lower wing</span>
          <span>Upper wing</span>
        </div>
      </div>
    </div>
  );
}
