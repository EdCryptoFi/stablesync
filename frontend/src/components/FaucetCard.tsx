'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Droplets, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const COOLDOWN_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'stablesync_faucet_last_claim';

const EXPLORER = 'https://explorer.solana.com/tx';

const TOKENS = [
  { symbol: 'SOL', amount: '2', key: 'sol' },
  { symbol: 'USDC', amount: '10,000', key: 'usdc' },
  { symbol: 'USDT', amount: '10,000', key: 'usdt' },
  { symbol: 'USDS', amount: '10,000', key: 'usds' },
];

type Status = 'idle' | 'loading' | 'success' | 'error' | 'cooldown';

export function FaucetCard() {
  const { publicKey } = useWallet();
  const [status, setStatus] = useState<Status>('idle');
  const [sigs, setSigs] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    const remaining = COOLDOWN_MS - (Date.now() - last);
    if (remaining > 0) {
      setStatus('cooldown');
      setCooldownSec(Math.ceil(remaining / 1000));
    }
  }, []);

  useEffect(() => {
    if (status !== 'cooldown') return;
    const id = setInterval(() => {
      setCooldownSec((s) => {
        if (s <= 1) {
          clearInterval(id);
          setStatus('idle');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  async function handleClaim() {
    if (!publicKey) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/faucet?wallet=${publicKey.toBase58()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Unknown error');
      }
      setSigs(data.sigs ?? {});
      setStatus('success');
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      // Start cooldown after next claim attempt
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
  }

  const formatCooldown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="hidden lg:block fixed right-6 top-24 w-68 z-30">
      <div className="bg-[#111a14] border border-[#2a3d33] rounded-2xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
            <Droplets size={14} className="text-[#10B981]" />
          </div>
          <div>
            <div className="text-white font-manrope font-bold text-sm">Devnet Faucet</div>
            <div className="text-[#A3A3A3] text-[10px]">Test tokens — no real value</div>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Devnet
          </span>
        </div>

        {/* Token list */}
        <div className="space-y-2 mb-4">
          {TOKENS.map((t) => (
            <div key={t.key} className="flex items-center justify-between text-xs">
              <span className="text-[#A3A3A3]">{t.symbol}</span>
              <span className="text-white font-mono font-semibold">
                {t.symbol === 'SOL' ? '◎' : '$'} {t.amount}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#2a3d33] my-3" />

        {/* Success state */}
        {status === 'success' && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[#4edea3] text-xs font-semibold">
              <CheckCircle size={13} />
              Tokens sent to your wallet!
            </div>
            <div className="space-y-1">
              {Object.entries(sigs).map(([key, sig]) => (
                <a
                  key={key}
                  href={`${EXPLORER}/${sig}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#A3A3A3] hover:text-[#4edea3] transition-colors"
                >
                  <ExternalLink size={9} />
                  {key.toUpperCase()} tx
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="mb-3 flex items-start gap-1.5 text-red-400 text-xs">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Claim button */}
        {status === 'cooldown' ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-xs font-manrope font-bold bg-[#262626] text-[#A3A3A3] cursor-not-allowed"
          >
            Available in {formatCooldown(cooldownSec)}
          </button>
        ) : (
          <button
            onClick={handleClaim}
            disabled={!publicKey || status === 'loading'}
            className="w-full py-2.5 rounded-xl text-xs font-manrope font-bold transition-all active:scale-[0.98]
              bg-[#10B981] hover:bg-[#0da06f] text-black
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                Claiming…
              </span>
            ) : !publicKey ? (
              'Connect wallet first'
            ) : (
              'Claim Devnet Tokens'
            )}
          </button>
        )}

        <p className="text-[10px] text-[#525252] text-center mt-3">
          1 claim per 5 min · Devnet only
        </p>
      </div>
    </div>
  );
}
