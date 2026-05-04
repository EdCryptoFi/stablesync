'use client';

import { AppNavbar } from '@/components/AppNavbar';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

interface PhaseItem {
  tag: string;
  status: 'done' | 'current' | 'upcoming';
  title: string;
  subtitle?: string;
  bullets: (string | { bold: string; rest: string })[];
  footer?: string;
}

const PHASES: PhaseItem[] = [
  {
    tag: 'Phase 1',
    status: 'current',
    title: 'Foundation',
    subtitle: 'Current',
    bullets: [
      'Automated rebalancing for USDC/USDT concentrated liquidity positions on Solana',
      'Non-custodial automation via Session Keys — no wallet signature required per rebalance',
      'Position creation, monitoring, and rebalance history dashboard',
      'Devnet live with full on-chain smart contract',
    ],
  },
  {
    tag: 'Phase 2',
    status: 'upcoming',
    title: 'Stablecoin Expansion',
    subtitle: 'Broaden support to the fastest-growing stablecoins in the ecosystem',
    bullets: [
      { bold: 'PYUSD', rest: '— PayPal USD, institutional-grade adoption' },
      { bold: 'USDS', rest: '— Sky (formerly MakerDAO) flagship stablecoin' },
      { bold: 'USD1', rest: '— World Liberty Financial, backed by U.S. Treasuries' },
      { bold: 'CASH', rest: '— Yield-bearing stablecoin' },
      { bold: 'AUSD', rest: '— Agora Dollar, multi-chain reserve-backed' },
      { bold: 'frxUSD', rest: '— Frax native dollar, deeply integrated with DeFi' },
    ],
    footer:
      'Each new stablecoin unlocks additional pairs, giving LPs more opportunities to deploy capital efficiently.',
  },
  {
    tag: 'Phase 3',
    status: 'upcoming',
    title: 'Pool Integrations',
    subtitle: 'Expand beyond a single DEX to aggregate the deepest liquidity sources on Solana',
    bullets: [
      { bold: 'Meteora', rest: '— Dynamic liquidity pools with adaptive fee tiers, optimized for stablecoin volatility ranges' },
      { bold: 'Raydium', rest: '— Concentrated liquidity AMM with high trading volume and broad market access' },
    ],
    footer:
      'Unified position management across pools from a single StableSync dashboard.',
  },
  {
    tag: 'Phase 4',
    status: 'upcoming',
    title: 'Strategy Expansion',
    bullets: [
      'Switch to Highest APR — StableSync monitors APR in real time across all supported pools and pairs. When a significantly better opportunity is detected, the strategy automatically migrates your position — closing the current one and opening a new one in the higher-yield pool — without any manual action from the user.',
    ],
    subtitle: 'Additional strategies in development',
    footer: '',
  },
];

const PHASE4_EXTRAS = [
  { bold: 'Range Optimizer', rest: '— Continuously tightens or widens the price range based on recent volatility to maximize fee capture' },
  { bold: 'Risk-Adjusted Yield', rest: '— Balances APR against pool depth and historical impermanent loss exposure' },
  { bold: 'Multi-Pool Splitting', rest: '— Splits capital across multiple pools and pairs simultaneously to reduce concentration risk while compounding returns' },
];

const PHASE5_BULLETS = [
  'Mobile-friendly interface for position monitoring on the go',
  'Public API for integrators and dashboards',
  'Governance module for protocol parameter updates',
  'Cross-chain expansion to stablecoin-heavy ecosystems beyond Solana',
];

const STATUS_CONFIG = {
  current: {
    dot: 'bg-[#10B981] ring-4 ring-[#10B981]/20',
    line: 'bg-[#10B981]',
    tag: 'text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20',
    card: 'border-[#10B981]/30 bg-[#0f1f18]',
  },
  upcoming: {
    dot: 'bg-[#262626] ring-4 ring-[#262626]/40',
    line: 'bg-[#262626]',
    tag: 'text-[#A3A3A3] bg-[#262626]/60 border border-[#3c3c3c]',
    card: 'border-[#262626] bg-[#171717]',
  },
  done: {
    dot: 'bg-[#10B981] ring-4 ring-[#10B981]/10',
    line: 'bg-[#10B981]',
    tag: 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20',
    card: 'border-[#262626] bg-[#171717]',
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="roadmap" />

      <main className="max-w-[860px] mx-auto px-8 pt-24 pb-20">
        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Phase 1 — Live on Devnet
          </div>
          <h1 className="font-manrope text-[48px] leading-[1.1] font-extrabold text-white tracking-[-0.02em] mb-4">
            Roadmap
          </h1>
          <p className="text-[18px] leading-[1.6] text-[#A3A3A3] max-w-2xl">
            StableSync's north star: every stablecoin LP should earn maximum yield without needing to watch
            the market — automated, non-custodial, and always on.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#10B981] via-[#262626] to-[#262626]" />

          <div className="space-y-10">
            {/* Phase 1 */}
            <Phase
              tag="Phase 1"
              status="current"
              title="Foundation"
              badge="Live"
              bullets={[
                'Automated rebalancing for USDC/USDT concentrated liquidity positions on Solana',
                'Non-custodial automation via Session Keys — no wallet signature required per rebalance',
                'Position creation, monitoring, and rebalance history dashboard',
                'Devnet live with full on-chain smart contract',
              ]}
            />

            {/* Phase 2 */}
            <Phase
              tag="Phase 2"
              status="upcoming"
              title="Stablecoin Expansion"
              subtitle="Broaden support to the fastest-growing stablecoins in the ecosystem:"
              pairs={[
                { bold: 'PYUSD', rest: '— PayPal USD, institutional-grade adoption' },
                { bold: 'USDS', rest: '— Sky (formerly MakerDAO) flagship stablecoin' },
                { bold: 'USD1', rest: '— World Liberty Financial, backed by U.S. Treasuries' },
                { bold: 'CASH', rest: '— Yield-bearing stablecoin' },
                { bold: 'AUSD', rest: '— Agora Dollar, multi-chain reserve-backed' },
                { bold: 'frxUSD', rest: '— Frax native dollar, deeply integrated with DeFi' },
              ]}
              footer="Each new stablecoin unlocks additional pairs, giving LPs more opportunities to deploy capital efficiently."
            />

            {/* Phase 3 */}
            <Phase
              tag="Phase 3"
              status="upcoming"
              title="Pool Integrations"
              subtitle="Expand beyond a single DEX to aggregate the deepest liquidity sources on Solana:"
              pairs={[
                { bold: 'Meteora', rest: '— Dynamic liquidity pools with adaptive fee tiers, optimized for stablecoin volatility ranges' },
                { bold: 'Raydium', rest: '— Concentrated liquidity AMM with high trading volume and broad market access' },
              ]}
              footer="Unified position management across pools from a single StableSync dashboard."
            />

            {/* Phase 4 */}
            <Phase
              tag="Phase 4"
              status="upcoming"
              title="Strategy Expansion"
              bullets={[
                'Switch to Highest APR — StableSync monitors APR in real time across all supported pools and pairs. When a significantly better opportunity is detected, the strategy automatically migrates your position without any manual action.',
              ]}
              subtitle="Additional strategies in development:"
              pairs={PHASE4_EXTRAS}
            />

            {/* Phase 5 */}
            <Phase
              tag="Phase 5"
              status="upcoming"
              title="Scale & Ecosystem"
              bullets={PHASE5_BULLETS}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

interface BoldRest { bold: string; rest: string }

function Phase({
  tag,
  status,
  title,
  badge,
  subtitle,
  bullets = [],
  pairs = [],
  footer,
}: {
  tag: string;
  status: 'current' | 'upcoming' | 'done';
  title: string;
  badge?: string;
  subtitle?: string;
  bullets?: string[];
  pairs?: BoldRest[];
  footer?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  const isCurrent = status === 'current';

  return (
    <div className="flex gap-6">
      {/* Dot */}
      <div className="relative flex-shrink-0 mt-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.dot} z-10 relative`}>
          {isCurrent ? (
            <CheckCircle2 size={18} className="text-black" />
          ) : (
            <Lock size={14} className="text-[#A3A3A3]" />
          )}
        </div>
      </div>

      {/* Card */}
      <div className={`flex-1 border rounded-xl p-6 mb-2 ${cfg.card}`}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.tag}`}>
            {tag}
          </span>
          <h2 className="font-manrope text-[20px] font-bold text-white">{title}</h2>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-[#10B981] px-2 py-0.5 rounded-full ml-auto">
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-[#A3A3A3] mb-3">{subtitle}</p>
        )}

        {bullets.length > 0 && (
          <ul className="space-y-2 mb-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#A3A3A3] leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4edea3] shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {pairs.length > 0 && (
          <ul className="space-y-2 mb-3">
            {pairs.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#A3A3A3] leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4edea3] shrink-0" />
                <span><span className="text-white font-semibold">{p.bold}</span>{p.rest}</span>
              </li>
            ))}
          </ul>
        )}

        {footer && (
          <p className="text-sm text-[#A3A3A3] mt-3 pt-3 border-t border-[#262626] italic">{footer}</p>
        )}
      </div>
    </div>
  );
}
