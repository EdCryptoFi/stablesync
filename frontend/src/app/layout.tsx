import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { StrategyProvider } from '@/contexts/StrategyContext';

export const metadata: Metadata = {
  title: 'StableSync — Automated Stablecoin Liquidity on Solana',
  description: 'Non-custodial, automated concentrated liquidity management for stablecoin pairs. Built on Orca Whirlpools.',
  openGraph: {
    title: 'StableSync',
    description: 'Set-and-forget stablecoin yield on Solana',
    siteName: 'StableSync',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <StrategyProvider>{children}</StrategyProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
