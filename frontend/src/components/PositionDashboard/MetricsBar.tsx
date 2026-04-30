'use client';

import { TrendingUp, DollarSign, Zap, AlertCircle } from 'lucide-react';

interface Metrics {
  totalPnl: number;
  accumulatedYield: number;
  solFeesPaid: number;
  realisedIL: number;
}

interface Props {
  metrics: Metrics;
}

export function MetricsBar({ metrics }: Props) {
  const items = [
    {
      label: 'Total PnL',
      value: `$${metrics.totalPnl.toFixed(2)}`,
      icon: TrendingUp,
      positive: metrics.totalPnl >= 0,
    },
    {
      label: 'Accumulated Yield',
      value: `$${metrics.accumulatedYield.toFixed(2)}`,
      icon: DollarSign,
      positive: true,
    },
    {
      label: 'SOL Fees Paid',
      value: `$${metrics.solFeesPaid.toFixed(4)}`,
      icon: Zap,
      positive: null,
    },
    {
      label: 'Realised IL',
      value: `$${Math.abs(metrics.realisedIL).toFixed(2)}`,
      icon: AlertCircle,
      positive: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface-800 border border-surface-600 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <item.icon size={14} className="text-gray-500" />
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
          <div
            className={`text-xl font-bold ${
              item.positive === true ? 'text-brand-400' :
              item.positive === false ? 'text-red-400' :
              'text-white'
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
