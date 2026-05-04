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
      value: `$${metrics.totalPnl.toFixed(4)}`,
      icon: TrendingUp,
      positive: metrics.totalPnl >= 0,
      iconBg: metrics.totalPnl >= 0 ? 'bg-[#10B981]/15' : 'bg-[#EF4444]/15',
      iconColor: metrics.totalPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]',
    },
    {
      label: 'Accumulated Yield',
      value: `$${metrics.accumulatedYield.toFixed(6)}`,
      icon: DollarSign,
      positive: true,
      iconBg: 'bg-[#10B981]/15',
      iconColor: 'text-[#10B981]',
    },
    {
      label: 'SOL Fees Paid',
      value: `${metrics.solFeesPaid.toFixed(6)} SOL`,
      icon: Zap,
      positive: null,
      iconBg: 'bg-[#F59E0B]/15',
      iconColor: 'text-[#F59E0B]',
    },
    {
      label: 'Realised IL',
      value: `$${Math.abs(metrics.realisedIL).toFixed(4)}`,
      icon: AlertCircle,
      positive: false,
      iconBg: 'bg-[#EF4444]/15',
      iconColor: 'text-[#EF4444]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label}
          className="bg-[#171717] border border-[#262626] hover:border-[#3c4a42] rounded-xl p-4 transition-colors group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                <item.icon size={13} className={item.iconColor} />
              </div>
              <span className="text-[11px] text-[#A3A3A3] font-medium tracking-wide">{item.label}</span>
            </div>
            <div className={`font-manrope text-[18px] font-bold leading-none ${
              item.positive === true ? 'text-[#4edea3]' :
              item.positive === false ? 'text-[#EF4444]' :
              'text-white'
            }`}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
