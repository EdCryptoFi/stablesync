'use client';

import { useState } from 'react';
import { RefreshCw, Play, Square, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { MetricsBar } from './MetricsBar';
import { PositionChart } from './PositionChart';
import { RebalanceHistory } from './RebalanceHistory';
import { useStrategy } from '@/hooks/useStrategy';
import { useRebalanceHistory } from '@/hooks/useRebalanceHistory';
import { useOrcaPools } from '@/hooks/useOrcaPools';
import type { PositionState } from '@/contexts/StrategyContext';

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

function PositionCard({ position }: { position: PositionState }) {
  const { toggleKeeper, closePosition, collectYield } = useStrategy();
  const { events } = useRebalanceHistory();
  const { pools } = useOrcaPools();
  const livePool = pools[position.pair];
  const [chartData] = useState(generateMockChartData);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const metrics = {
    totalPnl: position.accumulatedYield - position.solFeesPaid - position.realisedIL,
    accumulatedYield: position.accumulatedYield,
    solFeesPaid: position.solFeesPaid,
    realisedIL: position.realisedIL,
  };

  async function handleCollectYield() {
    setCollecting(true);
    try {
      await collectYield(position.pair);
    } finally {
      setCollecting(false);
    }
  }

  async function handleConfirmClose() {
    setShowCloseConfirm(false);
    await closePosition(position.pair);
  }

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
      {/* Close confirm overlay */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#171717] border border-[#262626] rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-manrope text-[20px] font-bold text-white mb-3">Close this position?</h3>
            <p className="text-[#A3A3A3] text-sm mb-6">All funds will be returned to your wallet.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 border border-[#262626] text-[#A3A3A3] font-semibold py-2.5 rounded-lg hover:border-[#3c4a42] hover:text-white transition-colors font-manrope"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-colors font-manrope"
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card header */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[#A3A3A3] hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-manrope text-[18px] font-bold text-white">{position.pair}</h2>
              {position.isRunning && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4edea3] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-[#A3A3A3]">
              ${position.amount.toLocaleString()} · every {position.intervalMinutes} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCollectYield}
            disabled={collecting || position.accumulatedYield <= 0}
            className="flex items-center gap-2 bg-[#4edea3] hover:bg-[#10B981] disabled:opacity-40 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-colors font-manrope"
          >
            {collecting ? 'Collecting…' : `Collect $${position.accumulatedYield.toFixed(4)}`}
          </button>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="flex items-center gap-2 border border-red-500/60 text-red-400 hover:bg-red-500/10 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors font-manrope"
          >
            Close
          </button>
          <button
            onClick={() => toggleKeeper(position.pair)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors font-manrope ${
              position.isRunning
                ? 'border border-[#262626] text-[#A3A3A3] hover:border-[#3c4a42] hover:text-white'
                : 'bg-[#10B981] hover:bg-[#0da06f] text-black font-bold'
            }`}
          >
            {position.isRunning ? <><Square size={11} /> Stop</> : <><Play size={11} /> Start</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#262626] pt-4">
          <MetricsBar metrics={metrics} />
          {livePool && (
            <div className="flex items-center gap-3 bg-[#0d1610] border border-[#2a3d33] rounded-lg px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-[#10B981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Orca mainnet
              </span>
              <span className="text-[#A3A3A3]">USDC/USDT price:</span>
              <span className="text-white font-bold font-mono">${livePool.price.toFixed(5)}</span>
              <span className="text-[#A3A3A3] ml-auto">Fee rate: {livePool.feeRatePct.toFixed(2)}%</span>
              <span className="text-[#A3A3A3]">TVL: ${(livePool.tvlUsdc / 1_000).toFixed(0)}K</span>
            </div>
          )}
          <PositionChart
            data={chartData}
            centerPrice={livePool?.price ?? 1.0001}
            lowerWing={(livePool?.price ?? 1.0001) * 0.99975}
            upperWing={(livePool?.price ?? 1.0001) * 1.00025}
          />
          <RebalanceHistory events={events} />
        </div>
      )}
    </div>
  );
}

export function PositionDashboard() {
  const { positions } = useStrategy();

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center mb-4">
          <RefreshCw size={24} className="text-[#A3A3A3]" />
        </div>
        <h3 className="font-manrope text-[24px] font-semibold text-white mb-2">No active positions</h3>
        <p className="text-[16px] text-[#A3A3A3] mb-6">Create a strategy to start earning yield.</p>
        <Link href="/app" className="bg-[#10B981] text-black font-bold px-6 py-3 rounded-lg font-manrope">
          Create Position
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-manrope text-[24px] font-bold text-white">
          Active Positions <span className="text-[#A3A3A3] font-normal text-[18px]">({positions.length})</span>
        </h1>
      </div>
      {positions.map((pos) => (
        <PositionCard key={pos.pair} position={pos} />
      ))}
    </div>
  );
}
