'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import { StrategyWizard } from '@/components/StrategyWizard';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AppPage() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-surface-900">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <RefreshCw size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white">StableSync</span>
        </Link>
        <WalletButton />
      </nav>

      {!connected ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center mb-5">
            <RefreshCw size={28} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connect your wallet to get started</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm">
            StableSync works with Phantom and Solflare on Solana Devnet.
          </p>
          <WalletButton />
        </div>
      ) : (
        <StrategyWizard />
      )}
    </div>
  );
}
