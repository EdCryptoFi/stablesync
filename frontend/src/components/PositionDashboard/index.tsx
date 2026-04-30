'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Play, Square, Settings } from 'lucide-react';
import { MetricsBar } from './MetricsBar';
import { PositionChart } from './PositionChart';
import { RebalanceHistory, RebalanceEvent } from './RebalanceHistory';
import { useStrategy } from '@/hooks/useStrategy';
import { useRebalanceHistory } from '@/hooks/useRebalanceHistory';

function generateMockChartData() {
  const data = [];
  let yieldAcc = 0;
  let feesAcc = 0;
  let il = 0;
  for (let i = 0; i < 24; i++) {
    yieldAcc += Math.random() * 0.003;
    feesAcc += Math.random() * 0.0005;
    il += (Math.random() - 0.52) * 0.0002;
    data.push({
      time: `${String(i).padStart(2, '0')}:00`,
      yield: yieldAcc,
      fees: feesAcc,
      il: Math.max(0, il),
    });
  }
  return data;
}

export function PositionDashboard() {
  const { position, isRunning, toggleKeeper } = useStrategy();
  const { events, loading: historyLoading } = useRebalanceHistory();
  const [chartData] = useState(generateMockChartData);

  const metrics = {
    totalPnl: (position?.accumulatedYield ?? 0) - (position?.solFeesPaid ?? 0) - (position?.realisedIL ?? 0),
    accumulatedYield: position?.accumulatedYield ?? 0,
    solFeesPaid: position?.solFeesPaid ?? 0,
    realisedIL: position?.realisedIL ?? 0,
  };

  if (!position) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-700 flex items-center justify-center mb-4">
          <RefreshCw size={24} className="text-gray-500" />
        </div>
        <h3 className="font-semibold mb-2">No active position</h3>
        <p className="text-sm text-gray-400 mb-6">Create a strategy to start earning yield.</p>
        <a href="/app" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          Create Position
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{position.pair} Position</h2>
          <p className="text-sm text-gray-400">Rebalancing every {position.intervalMinutes} min</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-surface-600 text-gray-400 hover:text-white hover:border-surface-500 transition-colors">
            <Settings size={15} />
          </button>
          <button
            onClick={toggleKeeper}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRunning
                ? 'border border-red-500/50 text-red-400 hover:bg-red-500/10'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
            }`}
          >
            {isRunning ? <><Square size={13} /> Stop Keeper</> : <><Play size={13} /> Start Keeper</>}
          </button>
        </div>
      </div>

      {/* Keeper status */}
      {isRunning && (
        <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-2.5 text-sm text-brand-400">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Keeper is active — monitoring price and rebalancing automatically
        </div>
      )}

      <MetricsBar metrics={metrics} />
      <PositionChart
        data={chartData}
        centerPrice={1.0001}
        lowerWing={0.9998}
        upperWing={1.0004}
      />
      <RebalanceHistory events={events} />
    </div>
  );
}
