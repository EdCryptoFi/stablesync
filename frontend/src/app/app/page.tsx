'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletButton } from '@/components/WalletButton';
import { StrategyWizard } from '@/components/StrategyWizard';
import { AppNavbar } from '@/components/AppNavbar';
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';

function ConnectScreen() {
  const { setVisible } = useWalletModal();

  return (
    <main className="min-h-screen flex items-center justify-center pt-16 px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#10B981]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[600px] z-10">
        {/* Main card */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-12 text-center shadow-2xl">
          {/* Icon */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#262626] border border-[#262626] relative">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-4 border-[#171717] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" stroke="none">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </div>

          <h1 className="font-manrope text-[32px] leading-[1.2] font-bold text-white mb-4">
            Connect your wallet to get started
          </h1>
          <p className="text-[16px] leading-[1.5] text-[#A3A3A3] mb-8 max-w-[400px] mx-auto">
            Manage your automated liquidity strategies with professional-grade tools. Supports{' '}
            <span className="text-white font-semibold">Phantom</span> and{' '}
            <span className="text-white font-semibold">Solflare</span> on Devnet.
          </p>

          <button
            onClick={() => setVisible(true)}
            className="w-full bg-[#10B981] hover:bg-[#0da06f] text-black font-manrope font-bold text-[24px] py-4 px-8 rounded-lg transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            Connect Wallet
          </button>

          {/* Trust indicators */}
          <div className="mt-8 pt-8 border-t border-[#262626] flex items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Shield size={14} />
              <span className="font-inter text-[12px] uppercase tracking-widest font-semibold">Audited Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Lock size={14} />
              <span className="font-inter text-[12px] uppercase tracking-widest font-semibold">Non-Custodial</span>
            </div>
          </div>
        </div>

        {/* Strategy preview card */}
        <div className="mt-4 bg-[#161d19] border border-[#262626]/50 rounded-xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
          <div className="p-4 flex items-center justify-between border-b border-[#262626]/50">
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8bd6b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-manrope text-sm text-white font-semibold">Active Strategy Monitoring</span>
            </div>
            <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
              Live
            </span>
          </div>
          <div className="p-4 font-mono text-xs text-[#4edea3] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Keeper active — USDC/USDT pool</span>
            </div>
            <div className="text-[#86948a]">Next rebalance check in 28s...</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AppPage() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="strategies" />

      {!connected ? <ConnectScreen /> : <StrategyWizard />}
    </div>
  );
}
