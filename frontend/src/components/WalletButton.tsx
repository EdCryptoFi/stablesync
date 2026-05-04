'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ChevronDown, LogOut } from 'lucide-react';
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
      <button className="flex items-center gap-2 bg-[#171717] border border-[#262626] text-[#A3A3A3] text-sm px-4 py-2 rounded-lg font-manrope">
        <span className="w-3 h-3 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="bg-[#10B981] hover:bg-[#0da06f] text-black font-bold px-4 py-2 rounded-lg text-sm active:scale-95 transition-all font-manrope"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 bg-[#171717] border border-[#262626] hover:border-[#4edea3]/50 text-sm font-medium px-4 py-2 rounded-lg transition-colors font-manrope text-white"
      >
        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
        {shortenAddress(publicKey.toBase58())}
        <ChevronDown size={13} className={`transition-transform text-[#A3A3A3] ${menuOpen ? 'rotate-180' : ''}`} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[#171717] border border-[#262626] rounded-lg overflow-hidden shadow-xl z-50">
          <button
            onClick={() => { disconnect(); setMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-[#262626] transition-colors font-manrope"
          >
            <LogOut size={13} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
