'use client';

import Link from 'next/link';
import { AppNavbar } from '@/components/AppNavbar';
import {
  BookOpen, Zap, Shield, RefreshCw, DollarSign,
  BarChart3, ExternalLink, Clock, Code2,
} from 'lucide-react';

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={20} className="text-[#4edea3]" />
        <h2 className="font-manrope text-[20px] font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] text-[#A3A3A3] leading-relaxed">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4edea3] shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="docs" />

      <main className="max-w-[900px] mx-auto px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={32} className="text-[#4edea3]" />
            <h1 className="font-manrope text-[48px] leading-[1.1] font-extrabold text-white tracking-[-0.02em]">
              Documentation
            </h1>
          </div>
          <p className="text-[18px] leading-[1.6] text-[#A3A3A3] max-w-2xl">
            StableSync — Automated Stablecoin Liquidity on Solana. Built for the Colosseum Frontier Hackathon 2026.
          </p>
        </div>

        {/* How it works */}
        <Section icon={RefreshCw} title="How it works">
          <ul className="space-y-3">
            <Bullet>You deposit stablecoins into a concentrated liquidity position on Orca Whirlpools</Bullet>
            <Bullet>A keeper bot monitors the price continuously and rebalances your position automatically</Bullet>
            <Bullet>Session keys allow non-custodial delegation — the keeper can only rebalance, never withdraw your funds</Bullet>
            <Bullet>Every rebalance is recorded on-chain as a PDA (Program Derived Address), giving you a full audit trail</Bullet>
            <Bullet>Accumulated yield can be collected at any time. You can close your position whenever you want.</Bullet>
          </ul>
        </Section>

        {/* Strategy 80/10/10 */}
        <Section icon={BarChart3} title="Strategy: 80 / 10 / 10 Range Allocation">
          <ul className="space-y-3 mb-5">
            <Bullet>80% of capital is placed in the <span className="text-white font-semibold">center range</span> (±0.025% from the current price) — this is the tight band that captures the highest fee yield</Bullet>
            <Bullet>10% is placed in the <span className="text-white font-semibold">lower wing</span> (below center) to capture downside price moves before rebalancing</Bullet>
            <Bullet>10% is placed in the <span className="text-white font-semibold">upper wing</span> (above center) to capture upside price moves</Bullet>
            <Bullet>When the price exits the center band, the keeper repositions all three ranges around the new price</Bullet>
            <Bullet>Optimized for stablecoin pairs (low volatility) — tight ranges maximize fee capture without frequent out-of-range periods</Bullet>
          </ul>
          <div className="flex rounded-lg overflow-hidden h-8 text-xs font-semibold font-manrope">
            <div className="bg-[#4edea3]/20 border-r border-[#0A0A0A] flex items-center justify-center text-[#4edea3]" style={{ width: '10%' }}>10%</div>
            <div className="bg-[#10B981]/30 flex items-center justify-center text-[#10B981] flex-1">80% center ±0.025%</div>
            <div className="bg-[#4edea3]/20 border-l border-[#0A0A0A] flex items-center justify-center text-[#4edea3]" style={{ width: '10%' }}>10%</div>
          </div>
          <div className="flex justify-between text-xs text-[#A3A3A3] mt-1.5">
            <span>Lower wing</span>
            <span>Highest fee capture</span>
            <span>Upper wing</span>
          </div>
        </Section>

        {/* Pairs */}
        <Section icon={DollarSign} title="Available Pairs (Solana Devnet)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'USDC / USDT',
                desc: 'Most liquid stablecoin pair on Orca Devnet. Reliable spreads and deep liquidity.',
                apy: '8–12%',
                badge: 'Recommended',
              },
              {
                name: 'USDC / USDS',
                desc: 'Emerging pair with lower liquidity and wider spreads. Higher potential yield, higher risk.',
                apy: '10–16%',
                badge: 'Higher yield',
              },
            ].map((p) => (
              <div key={p.name} className="bg-[#0A0A0A] border border-[#3c4a42] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-manrope font-bold text-white">{p.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded">{p.badge}</span>
                </div>
                <p className="text-[13px] text-[#A3A3A3] mb-3">{p.desc}</p>
                <div className="text-[#10B981] font-manrope font-bold">{p.apy} <span className="text-[#A3A3A3] font-normal text-xs">avg APY</span></div>
              </div>
            ))}
          </div>
        </Section>

        {/* Session Keys */}
        <Section icon={Shield} title="Session Keys — Non-Custodial Delegation">
          <ul className="space-y-3">
            <Bullet>A session key is a limited-permission delegation from your wallet to the keeper</Bullet>
            <Bullet>The keeper is authorized to call <span className="font-mono text-white text-sm">rebalance</span> on your position — nothing else</Bullet>
            <Bullet>Your funds stay in on-chain vaults controlled by the smart contract, not the keeper</Bullet>
            <Bullet>You sign the session key once during position creation. It expires automatically.</Bullet>
            <Bullet>You can revoke the session key at any time via the <span className="text-white font-semibold">revoke_session</span> instruction</Bullet>
          </ul>
        </Section>

        {/* Fees */}
        <Section icon={DollarSign} title="Fee Structure">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Platform fee', value: '10%', sub: 'of yield earned only' },
              { label: 'Deposit fee', value: '0%', sub: 'free to enter' },
              { label: 'Withdrawal fee', value: '0%', sub: 'free to exit' },
            ].map((f) => (
              <div key={f.label} className="bg-[#0A0A0A] border border-[#3c4a42] rounded-lg p-4 text-center">
                <div className="font-manrope text-[28px] font-bold text-[#4edea3]">{f.value}</div>
                <div className="text-white font-semibold text-sm">{f.label}</div>
                <div className="text-[#A3A3A3] text-xs mt-1">{f.sub}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-3">
            <Bullet>SOL network fees are charged on each rebalance transaction (~0.000042 SOL each)</Bullet>
            <Bullet>More frequent rebalancing = more yield captured + more SOL spent on fees</Bullet>
            <Bullet>The 30-minute interval is the recommended balance between yield and fee overhead</Bullet>
          </ul>
        </Section>

        {/* Rebalance intervals */}
        <Section icon={Clock} title="Rebalance Intervals">
          <div className="space-y-3">
            {[
              { label: '15 minutes', tag: 'Aggressive', color: '#F59E0B', desc: 'Maximum fee capture. Higher SOL costs. Best for periods of high pool activity.' },
              { label: '30 minutes', tag: 'Balanced', color: '#4edea3', desc: 'Recommended default. Good yield with reasonable gas overhead.' },
              { label: '1 hour', tag: 'Conservative', color: '#86948a', desc: 'Lowest SOL overhead. Less frequent repositioning. Best for stable price environments.' },
            ].map((opt) => (
              <div key={opt.label} className="flex items-start gap-4 bg-[#0A0A0A] border border-[#3c4a42] rounded-lg p-4">
                <div className="font-manrope font-bold text-white min-w-[90px]">{opt.label}</div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 mt-0.5" style={{ color: opt.color, background: opt.color + '18' }}>{opt.tag}</span>
                <span className="text-[14px] text-[#A3A3A3]">{opt.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Smart Contract */}
        <Section icon={Code2} title="Smart Contract">
          <ul className="space-y-3 mb-5">
            <Bullet>Network: <span className="text-white font-semibold">Solana Devnet</span></Bullet>
            <Bullet>Built with Anchor framework</Bullet>
            <Bullet>Built for <span className="text-white font-semibold">Colosseum Frontier Hackathon 2026</span></Bullet>
          </ul>
          <div className="bg-[#0A0A0A] border border-[#3c4a42] rounded-lg p-4 font-mono text-sm text-[#4edea3] mb-3">
            <div className="text-[#A3A3A3] text-xs mb-1">Program ID</div>
            7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6
          </div>
          <a
            href="https://explorer.solana.com/address/7D4zRu6F77ryuNbAWFh27YtWxApD8PszWFLhY1gqXMK6?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#4edea3] hover:text-white text-sm font-manrope font-semibold transition-colors"
          >
            View on Solana Explorer <ExternalLink size={13} />
          </a>
        </Section>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-[#171717] to-[#242c27] border border-[#3c4a42] rounded-xl p-8 text-center">
          <h3 className="font-manrope text-[24px] font-bold text-white mb-2">Ready to start earning?</h3>
          <p className="text-[#A3A3A3] mb-6">Connect your wallet and deploy your first strategy in under 2 minutes.</p>
          <Link href="/app" className="inline-block bg-[#10B981] text-black font-manrope font-bold px-8 py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all">
            Launch App
          </Link>
        </div>
      </main>
    </div>
  );
}
