'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, Zap, BarChart3, FileText } from 'lucide-react';
import { OrcaLiveStats } from '@/components/OrcaLiveStats';
import BorderGlow from '@/components/BorderGlow';
import dynamic from 'next/dynamic';

const SoftAurora = dynamic(() => import('@/components/SoftAurora'), { ssr: false });

const BRAND_GLOW = {
  glowColor: '160 70 55',
  colors: ['#10B981', '#4edea3', '#14B8A6'] as string[],
  backgroundColor: '#171717',
  borderRadius: 12,
  glowRadius: 32,
  glowIntensity: 0.9,
  edgeSensitivity: 25,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Navbar — glassmorphism */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 h-16 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#ffffff0d]">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter text-[#10B981] font-manrope drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">StableSync</span>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/app/position" className="text-neutral-400 font-medium hover:text-white transition-colors duration-200 font-manrope text-sm tracking-tight">Dashboard</Link>
              <Link href="/app" className="text-neutral-400 font-medium hover:text-white transition-colors duration-200 font-manrope text-sm tracking-tight">Strategies</Link>
              <Link href="/app/vault" className="text-neutral-400 font-medium hover:text-white transition-colors duration-200 font-manrope text-sm tracking-tight">Vault</Link>
              <Link href="/roadmap" className="text-neutral-400 font-medium hover:text-white transition-colors duration-200 font-manrope text-sm tracking-tight">Roadmap</Link>
              <Link href="/docs" className="text-neutral-400 font-medium hover:text-white transition-colors duration-200 font-manrope text-sm tracking-tight">Docs</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://x.com/Stable_Sync" target="_blank" rel="noopener noreferrer"
              className="text-neutral-400 hover:text-[#10B981] transition-colors text-sm font-manrope">Twitter</a>
            <a href="https://github.com/EdCryptoFi/stablesync" target="_blank" rel="noopener noreferrer"
              className="text-neutral-400 hover:text-[#10B981] transition-colors text-sm font-manrope">GitHub</a>
            <Link href="/app"
              className="bg-[#10B981] text-black font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#0da06f] active:scale-95 transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* SoftAurora WebGL background */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.55 }}>
            <SoftAurora
              speed={0.4}
              scale={1.2}
              brightness={1.2}
              color1="#4edea3"
              color2="#10B981"
              noiseFrequency={2.0}
              noiseAmplitude={0.8}
              bandHeight={0.55}
              bandSpread={1.2}
              octaveDecay={0.15}
              layerOffset={1.5}
              colorSpeed={0.6}
              enableMouseInteraction={true}
              mouseInfluence={0.15}
            />
          </div>

          <div className="max-w-[1200px] mx-auto px-8 py-[100px] flex flex-col md:flex-row items-center gap-14 relative z-10">
            <div className="md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 rounded-full px-4 py-1.5 text-sm text-[#4edea3]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="font-manrope font-semibold tracking-tight">Live on Solana Devnet</span>
              </div>
              <h1 className="font-manrope text-[56px] leading-[1.05] tracking-[-0.03em] font-extrabold text-white">
                Earn yield on<br />stablecoins.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4edea3] to-[#10B981]">Automatically.</span>
              </h1>
              <p className="text-[18px] leading-[1.7] text-[#A3A3A3] max-w-lg">
                StableSync provides non-custodial automated rebalancing on Orca Whirlpools. Maximize your capital efficiency without the manual effort.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/app"
                  className="bg-[#10B981] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#0da06f] active:scale-95 transition-all shadow-[0_0_32px_rgba(16,185,129,0.35)] font-manrope">
                  Launch App
                </Link>
                <a href="https://github.com/EdCryptoFi/stablesync" target="_blank" rel="noopener noreferrer"
                  className="border border-[#3c4a42] text-[#A3A3A3] font-semibold px-8 py-4 rounded-xl hover:border-[#4edea3]/60 hover:text-white transition-all font-manrope">
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Logo card — glowing brand hero */}
            <div className="md:w-1/2 relative group w-full flex justify-center">
              {/* Outer glow layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/25 via-[#4edea3]/10 to-[#14B8A6]/15 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-1000 scale-105" />
              <div className="absolute inset-0 bg-gradient-to-tl from-[#4edea3]/10 via-transparent to-[#10B981]/10 rounded-3xl blur-3xl opacity-40 group-hover:opacity-70 transition-all duration-1000" />

              {/* Card */}
              <div className="relative w-full max-w-[420px] bg-gradient-to-br from-[#0f1f18] via-[#111a14] to-[#0a1410] border border-[#2a4a35] rounded-3xl p-8 shadow-[0_0_80px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_120px_rgba(16,185,129,0.25)] transition-all duration-700">
                {/* Inner shimmer border */}
                <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-[#4edea3]/10 via-transparent to-transparent pointer-events-none" />

                {/* Top row — live badge */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#A3A3A3] font-manrope">StableSync Protocol</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Devnet Live
                  </span>
                </div>

                {/* Logo */}
                <div className="flex justify-center items-center py-6 relative">
                  <div className="absolute w-48 h-48 bg-[#10B981]/20 rounded-full blur-3xl" />
                  <Image
                    src="/logo.png"
                    alt="StableSync Logo"
                    width={200}
                    height={200}
                    className="relative z-10 drop-shadow-[0_0_40px_rgba(16,185,129,0.5)] group-hover:drop-shadow-[0_0_60px_rgba(16,185,129,0.7)] transition-all duration-700 group-hover:scale-105"
                    priority
                  />
                </div>

                {/* Wordmark */}
                <div className="text-center mt-4 mb-6">
                  <div className="font-manrope text-[28px] font-black tracking-[-0.03em] text-white drop-shadow-[0_0_20px_rgba(78,222,163,0.4)]">
                    Stable<span className="text-[#4edea3]">Sync</span>
                  </div>
                  <div className="text-xs text-[#A3A3A3] tracking-widest uppercase mt-1 font-manrope">
                    Automated Stablecoin Liquidity
                  </div>
                </div>

                {/* Bottom stats bar */}
                <div className="grid grid-cols-3 gap-3 pt-5 border-t border-[#2a4a35]">
                  {[
                    { label: 'APY', value: '8–14%' },
                    { label: 'Strategy', value: '80/10/10' },
                    { label: 'Fee', value: '10% yield' },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="font-manrope font-bold text-[#4edea3] text-sm">{s.value}</div>
                      <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section — live Orca data */}
        <OrcaLiveStats />

        {/* Features Section */}
        <section className="bg-gradient-to-b from-[#0a110d] to-[#0A0A0A] py-[80px] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#10B981]/5 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-[1200px] mx-auto px-8 relative z-10">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full mb-4">
                Why StableSync
              </span>
              <h2 className="font-manrope text-[36px] leading-[1.2] font-bold text-white mb-4">
                Institutional-Grade Automation
              </h2>
              <p className="text-[16px] leading-[1.6] text-[#A3A3A3] max-w-2xl mx-auto">
                Built for the Solana ecosystem, StableSync leverages high-speed execution to maintain your positions in the most profitable ranges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Feature 1 — large */}
              <BorderGlow className="md:col-span-2" {...BRAND_GLOW}>
                <div className="p-7">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center mb-5">
                    <Shield size={22} className="text-[#10B981]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-manrope text-[22px] font-bold text-white mb-3">Non-custodial</h3>
                  <p className="text-[15px] leading-[1.6] text-[#A3A3A3]">
                    Your assets stay in your control. StableSync only has permission to rebalance your liquidity within the Whirlpool parameters.
                  </p>
                </div>
              </BorderGlow>

              {/* Feature 2 */}
              <BorderGlow {...BRAND_GLOW}>
                <div className="p-7">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center mb-5">
                    <Zap size={22} className="text-[#10B981]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-manrope text-[20px] font-bold text-white mb-3">Automated</h3>
                  <p className="text-[14px] leading-[1.6] text-[#A3A3A3]">
                    24/7 keepers monitor price movements and rebalance instantly to prevent divergence loss.
                  </p>
                </div>
              </BorderGlow>

              {/* Feature 3 */}
              <BorderGlow {...BRAND_GLOW}>
                <div className="p-7">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center mb-5">
                    <BarChart3 size={22} className="text-[#10B981]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-manrope text-[20px] font-bold text-white mb-3">Optimized</h3>
                  <p className="text-[14px] leading-[1.6] text-[#A3A3A3]">
                    Dynamic range selection based on historical volatility and real-time order book depth.
                  </p>
                </div>
              </BorderGlow>

              {/* Feature 4 — full row */}
              <BorderGlow className="md:col-span-4" {...BRAND_GLOW}>
                <div className="p-7 flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center mb-5">
                      <FileText size={22} className="text-[#10B981]" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-manrope text-[22px] font-bold text-white mb-3">Transparent logs</h3>
                    <p className="text-[15px] leading-[1.6] text-[#A3A3A3]">
                      Every rebalance action is logged on-chain. Track your performance, fees, and strategy adjustments in real-time with our comprehensive explorer integration.
                    </p>
                  </div>
                  <div className="flex-1 w-full bg-[#0d1610] rounded-xl p-5 font-mono text-xs border border-[#2a3d33]">
                    <div className="mb-3 text-[#4a6655]">{'// Rebalance Event [Block #284,192]'}</div>
                    <div className="flex justify-between border-b border-[#1e2f25] pb-2 mb-2">
                      <span className="text-[#86948a]">Action:</span>
                      <span className="text-white">ShiftRange <span className="text-[#10B981]">✓</span></span>
                    </div>
                    <div className="flex justify-between border-b border-[#1e2f25] pb-2 mb-2">
                      <span className="text-[#86948a]">Old Tick:</span>
                      <span className="text-[#A3A3A3]">420.69 <span className="text-[#4edea3]">→</span> <span className="text-white">421.15</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#86948a]">Yield Harvested:</span>
                      <span className="text-[#4edea3] font-semibold">+0.045 USDC</span>
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-[1200px] mx-auto px-8 py-[80px]">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full mb-4">
              How it works
            </span>
            <h2 className="font-manrope text-[36px] leading-[1.2] font-bold text-white">
              Three steps to passive yield
            </h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-6 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#10B981] via-[#10B981] to-[#3c4a42] z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { n: '1', active: true,  title: 'Connect Wallet',  desc: 'Link your Solana wallet and select the stablecoin pair you want to provide liquidity for.' },
                { n: '2', active: true,  title: 'Deploy Capital',  desc: 'StableSync deposits your assets into Orca Whirlpools using an optimized narrow range.' },
                { n: '3', active: false, title: 'Earn & Compound', desc: 'Our keeper bot automatically rebalances and compounds your fees back into the pool.' },
              ].map((step) => (
                <div key={step.n} className="flex flex-col items-center text-center group">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-5 font-manrope transition-transform group-hover:scale-110 ${
                    step.active
                      ? 'bg-[#10B981] text-black shadow-[0_0_24px_rgba(16,185,129,0.5)]'
                      : 'bg-[#171717] border-2 border-[#3c4a42] text-[#A3A3A3]'
                  }`}>
                    {step.n}
                  </div>
                  <h4 className="font-manrope text-[20px] font-bold text-white mb-2">{step.title}</h4>
                  <p className="text-[15px] leading-[1.6] text-[#A3A3A3]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-[1200px] mx-auto px-8 pb-[100px]">
          <div className="relative overflow-hidden rounded-2xl border border-[#2a3d33] bg-gradient-to-br from-[#0f1f18] via-[#111714] to-[#0d1610]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#10B981]/10 rounded-full blur-[80px]" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#4edea3]/5 rounded-full blur-3xl -mr-20 -mt-20" />
            </div>
            <div className="relative z-10 px-12 py-16 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Devnet Live
              </div>
              <h2 className="font-manrope text-[40px] font-extrabold text-white mb-4 tracking-[-0.02em]">
                Ready to optimize your yield?
              </h2>
              <p className="text-[17px] leading-[1.7] text-[#A3A3A3] mb-8 max-w-xl mx-auto">
                Join the automated revolution and let StableSync manage your concentrated liquidity positions.
              </p>
              <Link href="/app"
                className="inline-block bg-[#10B981] text-black font-bold px-12 py-4 rounded-xl text-[16px] hover:bg-[#0da06f] active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] font-manrope">
                Launch App Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ffffff08]">
        <div className="max-w-[1200px] mx-auto py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="text-[#10B981] font-bold font-manrope text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">StableSync</div>
            <div className="text-xs uppercase tracking-widest text-neutral-600 font-manrope">
              Colosseum Frontier Hackathon 2026
            </div>
          </div>
          <div className="flex gap-8">
            {[
              { label: 'GitHub', href: 'https://github.com/EdCryptoFi/stablesync' },
              { label: 'Twitter', href: 'https://x.com/Stable_Sync' },
              { label: 'Docs', href: '/docs' },
            ].map((l) => (
              <a key={l.label} href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-xs uppercase tracking-widest text-neutral-500 hover:text-[#10B981] transition-colors font-manrope">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
