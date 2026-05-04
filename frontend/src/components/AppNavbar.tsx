'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/WalletButton';
import type { ReactNode } from 'react';

type NavItem = 'dashboard' | 'strategies' | 'vault' | 'docs' | 'roadmap';

interface Props {
  active?: NavItem;
  extra?: ReactNode;
}

const NAV_ITEMS: { id: NavItem; label: string; href: string }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/app/position' },
  { id: 'strategies', label: 'Strategies', href: '/app' },
  { id: 'vault', label: 'Vault', href: '/app/vault' },
  { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
  { id: 'docs', label: 'Docs', href: '/docs' },
];

export function AppNavbar({ active, extra }: Props) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#ffffff0d]">
      <div className="max-w-[1200px] mx-auto h-16 px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black tracking-tighter text-[#10B981] font-manrope">
            StableSync
          </Link>
          <div className="hidden md:flex items-center gap-6 font-manrope text-sm tracking-tight">
            {NAV_ITEMS.map((item) =>
              item.id === active ? (
                <span key={item.id} className="text-[#10B981] font-bold border-b-2 border-[#10B981] pb-1">
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-neutral-400 font-medium hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {extra}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
