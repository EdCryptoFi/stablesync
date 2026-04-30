'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Zap, BarChart3, RefreshCw } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-surface-700 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <RefreshCw size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white">StableSync</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/stablesync_sol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            @stablesync_sol
          </a>
          <Link
            href="/app"
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Launch App <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-700 border border-surface-600 rounded-full px-4 py-1.5 text-sm text-brand-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Live on Solana Devnet
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
            Earn yield on stablecoins.{' '}
            <span className="text-brand-400">Automatically.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            StableSync manages your concentrated liquidity positions on Orca Whirlpools —
            rebalancing on autopilot, without ever touching your funds.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-base"
            >
              Start Earning <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com/stablesync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-24">
          {[
            { label: 'Avg APY (USDC/USDT)', value: '8–14%' },
            { label: 'Min rebalance interval', value: '15 min' },
            { label: 'Platform fee', value: '0.2% of yield' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-800 border border-surface-600 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-brand-400 mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-center mb-12">Why StableSync</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Shield,
                title: 'Non-custodial',
                desc: 'Session keys let the keeper rebalance without ever holding your tokens.',
              },
              {
                icon: Zap,
                title: 'Automated',
                desc: 'Timer + price triggers fire automatically. No manual intervention needed.',
              },
              {
                icon: BarChart3,
                title: 'Optimized ranges',
                desc: '80% center ±0.025% + 10% wings captures maximum fees on tight stablecoin ranges.',
              },
              {
                icon: RefreshCw,
                title: 'Transparent logs',
                desc: 'Every rebalance recorded on-chain. Full PnL history, no black boxes.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-surface-800 border border-surface-600 rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-brand-400" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-24 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Choose your pair', desc: 'Select USDC/USDT or USDC/USDS and configure your investment amount.' },
              { step: '02', title: 'Set your interval', desc: 'Pick how often the keeper should rebalance (min 15 min). Shorter = more yield, more SOL fees.' },
              { step: '03', title: 'Sign once, earn always', desc: 'Delegate a session key to our keeper. It rebalances for you — you keep full custody at all times.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 bg-surface-800 border border-surface-600 rounded-xl p-5">
                <div className="text-brand-500 font-mono font-bold text-lg min-w-[2rem]">{item.step}</div>
                <div>
                  <div className="font-semibold mb-1">{item.title}</div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-24 text-center bg-surface-800 border border-surface-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to automate your yield?</h2>
          <p className="text-gray-400 mb-8">Connect your wallet. Set up in under 2 minutes.</p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Launch App <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-surface-700 py-6 text-center text-sm text-gray-500">
        Built for Colosseum Frontier Hackathon 2026 · Solana · Orca · Pyth
      </footer>
    </div>
  );
}
