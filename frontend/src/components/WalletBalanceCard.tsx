'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { RefreshCw } from 'lucide-react';
import BorderGlow from '@/components/BorderGlow';

const MINTS = {
  USDC: new PublicKey('BZCSMV4ZaBMSUZnojhCnhYE5R919YN2b4U39JVEjnQzs'),
  USDT: new PublicKey('2KrpCa2VCa9M1LVJn9Re43fyjVPCBgtUu87Z4kGdebvr'),
  USDS: new PublicKey('HKgm8LzDNAk3skpu5yQYUjEfdSrkNX4Vsh3xPEQmD6fT'),
};

const BRAND_GLOW = {
  glowColor: '160 70 55',
  colors: ['#10B981', '#4edea3', '#14B8A6'] as string[],
  backgroundColor: '#111a14',
  borderRadius: 16,
  glowRadius: 28,
  glowIntensity: 0.85,
  edgeSensitivity: 20,
};

interface Balances { sol: number; usdc: number; usdt: number; usds: number }

async function fetchTokenBalance(
  connection: ReturnType<typeof useConnection>['connection'],
  mint: PublicKey,
  owner: PublicKey,
): Promise<number> {
  try {
    const ata = getAssociatedTokenAddressSync(mint, owner);
    const acct = await getAccount(connection, ata);
    return Number(acct.amount) / 1_000_000;
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) return 0;
    return 0;
  }
}

export function WalletBalanceCard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const [lamports, usdc, usdt, usds] = await Promise.all([
        connection.getBalance(publicKey),
        fetchTokenBalance(connection, MINTS.USDC, publicKey),
        fetchTokenBalance(connection, MINTS.USDT, publicKey),
        fetchTokenBalance(connection, MINTS.USDS, publicKey),
      ]);
      setBalances({ sol: lamports / LAMPORTS_PER_SOL, usdc, usdt, usds });
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  if (!publicKey) return null;

  const rows = [
    { symbol: 'SOL', icon: '◎', value: balances?.sol, decimals: 4 },
    { symbol: 'USDC', icon: '$', value: balances?.usdc, decimals: 2 },
    { symbol: 'USDT', icon: '$', value: balances?.usdt, decimals: 2 },
    { symbol: 'USDS', icon: '$', value: balances?.usds, decimals: 2 },
  ];

  return (
    <div className="hidden lg:block fixed right-6 top-[370px] w-68 z-30">
      <BorderGlow {...BRAND_GLOW} className="w-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-manrope font-bold text-white uppercase tracking-widest">Wallet</span>
            <button
              onClick={refresh}
              disabled={loading}
              className="text-[#A3A3A3] hover:text-[#4edea3] transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-2.5">
            {rows.map((r) => (
              <div key={r.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#4edea3] text-xs font-mono w-3">{r.icon}</span>
                  <span className="text-[#A3A3A3] text-xs font-manrope">{r.symbol}</span>
                </div>
                <span className="text-white font-mono text-xs font-semibold">
                  {r.value == null ? (
                    <span className="text-[#3c4a42]">—</span>
                  ) : (
                    r.value.toFixed(r.decimals)
                  )}
                </span>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <p className="text-[10px] text-[#525252] mt-3 text-right">{lastUpdated}</p>
          )}
        </div>
      </BorderGlow>
    </div>
  );
}
