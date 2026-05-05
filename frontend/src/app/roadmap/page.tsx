'use client';

import Link from 'next/link';
import { AppNavbar } from '@/components/AppNavbar';
import BorderGlow from '@/components/BorderGlow';
import { CheckCircle2, CircleDot, Circle } from 'lucide-react';

const BRAND_GLOW = {
  glowColor: '160 70 55',
  colors: ['#10B981', '#4edea3', '#14B8A6'] as string[],
  backgroundColor: '#0f1f18',
  borderRadius: 14,
  glowRadius: 36,
  glowIntensity: 1.0,
  edgeSensitivity: 22,
};

const UPCOMING_GLOW = {
  glowColor: '160 30 35',
  colors: ['#262626', '#3c4a42', '#262626'] as string[],
  backgroundColor: '#171717',
  borderRadius: 14,
  glowRadius: 28,
  glowIntensity: 0.6,
  edgeSensitivity: 22,
};

interface BoldRest { bold: string; rest: string }

type PhaseStatus = 'live' | 'in-progress' | 'upcoming';

interface PhaseProps {
  num: string;
  status: PhaseStatus;
  title: string;
  bullets?: (string | BoldRest)[];
  footer?: string;
  side: 'left' | 'right';
}

function isBoldRest(b: string | BoldRest): b is BoldRest {
  return typeof b === 'object';
}

const STATUS_META: Record<PhaseStatus, {
  badge: string;
  badgeCls: string;
  dot: React.ReactNode;
  lineCls: string;
}> = {
  live: {
    badge: 'LIVE',
    badgeCls: 'bg-[#10B981]/15 text-[#4edea3] border border-[#10B981]/30',
    dot: <CheckCircle2 size={16} className="text-black" />,
    lineCls: 'bg-[#10B981]',
  },
  'in-progress': {
    badge: 'IN PROGRESS',
    badgeCls: 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30',
    dot: <CircleDot size={16} className="text-black" />,
    lineCls: 'bg-[#10B981]',
  },
  upcoming: {
    badge: 'UPCOMING',
    badgeCls: 'bg-[#262626] text-[#A3A3A3] border border-[#3c3c3c]',
    dot: <Circle size={14} className="text-[#525252]" />,
    lineCls: 'bg-[#262626]',
  },
};

function PhaseCard({ num, status, title, bullets = [], footer, side }: PhaseProps) {
  const meta = STATUS_META[status];
  const isLive = status === 'live' || status === 'in-progress';
  const glow = isLive ? BRAND_GLOW : UPCOMING_GLOW;

  const cardContent = (
    <BorderGlow {...glow} className="w-full">
      <div className="p-6 relative overflow-hidden min-h-[160px]">
        {/* Watermark number */}
        <div className="absolute bottom-2 right-4 font-manrope font-black text-[80px] leading-none text-white/[0.04] select-none pointer-events-none">
          {num.padStart(2, '0')}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.badgeCls}`}>
              {meta.badge}
            </span>
          </div>
          <h3 className="font-manrope text-[20px] font-bold text-white mb-3">{title}</h3>

          {bullets.length > 0 && (
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#A3A3A3] leading-relaxed">
                  {isLive ? (
                    <CheckCircle2 size={14} className="text-[#4edea3] shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={12} className="text-[#525252] shrink-0 mt-1" />
                  )}
                  {isBoldRest(b) ? (
                    <span><span className="text-white font-semibold">{b.bold}</span>{b.rest}</span>
                  ) : (
                    <span>{b}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {footer && (
            <p className="text-xs text-[#525252] mt-4 pt-3 border-t border-[#262626] italic">{footer}</p>
          )}
        </div>
      </div>
    </BorderGlow>
  );

  return (
    <div className={`flex items-center gap-0 ${side === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Card half */}
      <div className="w-[calc(50%-28px)]">{cardContent}</div>

      {/* Center dot */}
      <div className="w-14 flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 ${isLive ? 'bg-[#10B981]' : 'bg-[#1a1a1a] border-2 border-[#262626]'}`}>
          {meta.dot}
        </div>
      </div>

      {/* Empty half */}
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}

const PHASE4_EXTRAS: BoldRest[] = [
  { bold: 'Range Optimizer', rest: ' — Continuously tightens or widens the price range based on recent volatility to maximize fee capture' },
  { bold: 'Risk-Adjusted Yield', rest: ' — Balances APR against pool depth and historical impermanent loss exposure' },
  { bold: 'Multi-Pool Splitting', rest: ' — Splits capital across multiple pools and pairs simultaneously' },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="roadmap" />

      <main className="max-w-[1100px] mx-auto px-8 pt-24 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full mb-4">
            FUTURE TRAJECTORY
          </div>
          <h1 className="font-manrope text-[42px] leading-[1.1] font-extrabold text-white tracking-[-0.02em] mb-4">
            Protocol Roadmap
          </h1>
          <p className="text-[16px] leading-[1.6] text-[#A3A3A3] max-w-2xl mx-auto">
            Tracing the evolution of StableSync from a foundational keeper to a comprehensive multi-chain yield optimization ecosystem.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical center line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#10B981] via-[#10B981]/40 to-[#262626]" />

          <div className="space-y-10">
            <PhaseCard
              num="1"
              status="live"
              side="left"
              title="Foundation"
              bullets={[
                'Automated rebalancing for USDC/USDT core pairs',
                'Non-custodial keeper infrastructure launch',
                'Real-time PnL and yield tracking dashboard',
              ]}
            />

            <PhaseCard
              num="2"
              status="live"
              side="right"
              title="Stablecoin Expansion"
              bullets={[
                { bold: 'PYUSD', rest: ' — PayPal USD, institutional-grade adoption' },
                { bold: 'USDS', rest: ' — Sky (formerly MakerDAO) flagship stablecoin' },
                { bold: 'USD1', rest: ' — World Liberty Financial, backed by U.S. Treasuries' },
              ]}
              footer="Each new stablecoin unlocks additional pairs, giving LPs more opportunities."
            />

            <PhaseCard
              num="3"
              status="in-progress"
              side="left"
              title="Pool Integrations"
              bullets={[
                { bold: 'Meteora', rest: ' Dynamic Vaults & DLMM Integration' },
                'Orca Whirlpools custom liquidity range automation',
                'Multi-Pool Splitting for optimal capital efficiency',
              ]}
            />

            <PhaseCard
              num="4"
              status="upcoming"
              side="right"
              title="Strategy Expansion"
              bullets={[
                'Delta-neutral stablecoin hedging strategies',
                'LST-backed yield compounding (JitoSOL/mSOL)',
                'Custom user-defined rebalancing triggers',
              ]}
            />

            <PhaseCard
              num="5"
              status="upcoming"
              side="left"
              title="Scale & Ecosystem"
              bullets={[
                'Cross-chain stablecoin routing via Wormhole',
                'Governance token launch for protocol parameter control',
                'StableSync SDK for 3rd party dApp integration',
              ]}
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16">
          <BorderGlow {...BRAND_GLOW} className="w-full">
            <div className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1">
                <h3 className="font-manrope text-[24px] font-bold text-white mb-2">Built for Perpetual Stability</h3>
                <p className="text-[15px] leading-[1.6] text-[#A3A3A3] max-w-lg">
                  Our roadmap is driven by the mission to make DeFi yield management invisible yet invincible. As the Solana ecosystem scales, StableSync evolves to provide the most robust, non-custodial automation layer for professional and retail liquidity providers alike.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href="/app"
                  className="bg-[#10B981] hover:bg-[#0da06f] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all font-manrope">
                  Explore Dashboard
                </Link>
                <Link href="/docs"
                  className="border border-[#3c4a42] text-[#A3A3A3] hover:text-white hover:border-[#4edea3]/50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all font-manrope">
                  Read Docs
                </Link>
              </div>
            </div>
          </BorderGlow>
        </div>
      </main>
    </div>
  );
}
