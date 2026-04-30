'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';

interface DataPoint {
  time: string;
  yield: number;
  fees: number;
  il: number;
}

interface Props {
  data: DataPoint[];
  centerPrice: number;
  lowerWing: number;
  upperWing: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-3 text-xs shadow-xl">
      <div className="text-gray-400 mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">${p.value.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

export function PositionChart({ data, centerPrice, lowerWing, upperWing }: Props) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">PnL Evolution</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-500 inline-block" />Yield</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-yellow-500 inline-block" />Fees</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block" />IL</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2e24" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="yield" name="Yield" stroke="#22c55e" fill="url(#yieldGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="fees" name="Fees" stroke="#eab308" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          <Area type="monotone" dataKey="il" name="IL" stroke="#ef4444" fill="none" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
