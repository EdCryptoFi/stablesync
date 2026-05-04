'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
    <div className="bg-[#171717] border border-[#3c4a42] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-[#A3A3A3] mb-2 font-manrope">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-white">${p.value.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

export function PositionChart({ data }: Props) {
  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-manrope font-semibold text-white text-sm">PnL Evolution (24h)</h3>
        <div className="flex items-center gap-4 text-xs text-[#A3A3A3]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#10B981] inline-block rounded" />Yield
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#F59E0B] inline-block rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#F59E0B 0,#F59E0B 4px,transparent 4px,transparent 8px)' }} />Fees
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#EF4444] inline-block rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#EF4444 0,#EF4444 4px,transparent 4px,transparent 8px)' }} />IL
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#A3A3A3' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#A3A3A3' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="yield" name="Yield" stroke="#10B981" fill="url(#yieldGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="fees" name="Fees" stroke="#F59E0B" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          <Area type="monotone" dataKey="il" name="IL" stroke="#EF4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
