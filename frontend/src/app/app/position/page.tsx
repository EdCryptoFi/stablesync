'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import { PositionDashboard } from '@/components/PositionDashboard';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PositionPage() {
  return (
    <div className="min-h-screen bg-surface-900">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <RefreshCw size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white">StableSync</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-xs text-gray-400 hover:text-white transition-colors">+ New Position</Link>
          <WalletButton />
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <PositionDashboard />
      </main>
    </div>
  );
}
