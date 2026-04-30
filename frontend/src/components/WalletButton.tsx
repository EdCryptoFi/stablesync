'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);

  if (connecting) {
    return (
      <button className="flex items-center gap-2 border border-surface-600 text-gray-400 text-sm px-4 py-2 rounded-lg">
        <span className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 border border-brand-500 text-brand-400 hover:bg-brand-500/10 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Wallet size={14} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 bg-surface-700 border border-surface-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:border-brand-500/50"
      >
        <div className="w-2 h-2 rounded-full bg-brand-500" />
        {shortenAddress(publicKey.toBase58())}
        <ChevronDown size={13} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface-800 border border-surface-600 rounded-lg overflow-hidden shadow-xl z-50">
          <button
            onClick={() => { disconnect(); setMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-surface-700 transition-colors"
          >
            <LogOut size={13} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
