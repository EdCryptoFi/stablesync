'use client';

import { useState } from 'react';
import { AppNavbar } from '@/components/AppNavbar';
import { useVault } from '@/contexts/VaultContext';
import { useVaultBalance } from '@/hooks/useVaultBalance';
import { useStrategy } from '@/contexts/StrategyContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Lock, TrendingUp, History, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
      <div className="text-xs text-[#A3A3A3] font-medium mb-1">{label}</div>
      <div className={`font-manrope text-[28px] font-bold leading-none ${accent ? 'text-[#4edea3]' : 'text-white'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#A3A3A3] mt-1">{sub}</div>}
    </div>
  );
}

function DepositWithdraw() {
  const { balance, loading, deposit, withdraw } = useVault();
  const { availableBalance } = useVaultBalance();
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const parsed = Number(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  async function handleSubmit() {
    setError('');
    if (!isValid) return;
    try {
      if (tab === 'deposit') {
        await deposit(parsed);
      } else {
        if (parsed > availableBalance) {
          setError(`Max withdrawable: $${availableBalance.toFixed(2)} (locked funds excluded)`);
          return;
        }
        await withdraw(parsed);
      }
      setAmount('');
    } catch (e: any) {
      setError(e?.message ?? 'Transaction failed');
    }
  }

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#262626]">
        {(['deposit', 'withdraw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setAmount(''); }}
            className={`flex-1 py-3.5 text-sm font-semibold font-manrope transition-colors ${
              tab === t
                ? 'text-[#4edea3] border-b-2 border-[#4edea3] bg-[#4edea3]/5'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {t === 'deposit' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
              {t === 'deposit' ? 'Deposit' : 'Withdraw'}
            </span>
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {tab === 'deposit' ? (
          <p className="text-xs text-[#A3A3A3]">
            Add USDC to your vault. Deposited funds become available for strategy allocation.
          </p>
        ) : (
          <p className="text-xs text-[#A3A3A3]">
            Withdraw idle USDC from your vault. Funds locked in active strategies cannot be withdrawn.
          </p>
        )}

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-[#A3A3A3]">Amount (USDC)</label>
            <button
              onClick={() =>
                setAmount(tab === 'deposit' ? '1000' : String(availableBalance.toFixed(2)))
              }
              className="text-xs text-[#4edea3] hover:text-white transition-colors"
            >
              Max
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] text-sm font-medium">$</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="0.00"
              className="w-full bg-[#0A0A0A] border border-[#3c4a42] rounded-lg pl-7 pr-3 py-3 text-white text-sm font-manrope font-semibold placeholder:text-[#3c4a42] focus:outline-none focus:border-[#4edea3] transition-colors"
            />
          </div>
          {tab === 'withdraw' && (
            <div className="text-xs text-[#A3A3A3] mt-1.5">
              Available to withdraw: <span className="text-white font-semibold">${availableBalance.toFixed(2)}</span>
            </div>
          )}
          {tab === 'deposit' && (
            <div className="text-xs text-[#A3A3A3] mt-1.5">
              Vault balance after: <span className="text-white font-semibold">${(balance + (isValid ? parsed : 0)).toFixed(2)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#0da06f] disabled:opacity-40 disabled:cursor-not-allowed text-black font-manrope font-bold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Waiting for wallet…' : tab === 'deposit' ? 'Deposit USDC' : 'Withdraw USDC'}
        </button>

        <p className="text-[11px] text-[#A3A3A3] text-center">
          Your wallet will prompt you to sign the transaction
        </p>
      </div>
    </div>
  );
}

function ActiveStrategies() {
  const { positions } = useStrategy();

  if (positions.length === 0) {
    return (
      <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
        <h3 className="font-manrope font-semibold text-white text-sm mb-3">Active Strategies</h3>
        <p className="text-sm text-[#A3A3A3]">
          No active strategies.{' '}
          <Link href="/app" className="text-[#4edea3] hover:underline">Create one →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between">
        <h3 className="font-manrope font-semibold text-white text-sm">Active Strategies</h3>
        <Link href="/app/position" className="text-xs text-[#4edea3] hover:text-white transition-colors font-manrope font-semibold">
          View Dashboard →
        </Link>
      </div>
      <div className="divide-y divide-[#262626]">
        {positions.map((p) => (
          <div key={p.pair} className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {p.isRunning && (
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white font-manrope">{p.pair}</div>
                <div className="text-xs text-[#A3A3A3]">every {p.intervalMinutes} min</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white font-manrope">${p.amount.toLocaleString()}</div>
              <div className="text-xs text-[#4edea3]">+${p.accumulatedYield.toFixed(4)} yield</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionHistory() {
  const { transactions } = useVault();

  if (transactions.length === 0) {
    return (
      <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
        <h3 className="font-manrope font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <History size={15} className="text-[#A3A3A3]" />
          Transaction History
        </h3>
        <p className="text-sm text-[#A3A3A3]">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#262626]">
        <h3 className="font-manrope font-semibold text-white text-sm flex items-center gap-2">
          <History size={15} className="text-[#A3A3A3]" />
          Transaction History
        </h3>
      </div>
      <div className="divide-y divide-[#262626]">
        {transactions.map((tx) => (
          <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                tx.type === 'deposit' ? 'bg-[#10B981]/15' : 'bg-[#F59E0B]/15'
              }`}>
                {tx.type === 'deposit'
                  ? <ArrowDownToLine size={13} className="text-[#10B981]" />
                  : <ArrowUpFromLine size={13} className="text-[#F59E0B]" />
                }
              </div>
              <div>
                <div className="text-sm font-semibold text-white font-manrope capitalize">{tx.type}</div>
                <div className="text-xs text-[#A3A3A3]">
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold font-manrope ${tx.type === 'deposit' ? 'text-[#4edea3]' : 'text-[#F59E0B]'}`}>
                {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
              </div>
              {tx.txSig && (
                <div className="text-[11px] text-[#A3A3A3] font-mono truncate max-w-[100px]">
                  {tx.txSig.slice(0, 8)}…
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectPrompt() {
  const { setVisible } = useWalletModal();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center mb-4">
        <Wallet size={24} className="text-[#A3A3A3]" />
      </div>
      <h3 className="font-manrope text-[24px] font-semibold text-white mb-2">Connect your wallet</h3>
      <p className="text-[#A3A3A3] mb-6">Connect to manage your vault.</p>
      <button
        onClick={() => setVisible(true)}
        className="bg-[#10B981] text-black font-bold px-6 py-3 rounded-lg font-manrope"
      >
        Connect Wallet
      </button>
    </div>
  );
}

export default function VaultPage() {
  const { connected } = useWallet();
  const { totalBalance, availableBalance, lockedAmount, totalEarned } = useVaultBalance();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="vault" extra={
        connected ? (
          <Link href="/app" className="text-xs text-[#4edea3] hover:text-white transition-colors font-manrope font-semibold">
            + New Strategy
          </Link>
        ) : undefined
      } />
      <main className="max-w-[1200px] mx-auto px-8 pt-24 pb-12">
        {!connected ? (
          <ConnectPrompt />
        ) : (
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="font-manrope text-[32px] font-bold text-white leading-tight">Vault</h1>
              <p className="text-[#A3A3A3] text-sm mt-1">
                Deposit USDC to allocate across strategies. Strategies draw from your available vault balance.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Balance"
                value={`$${totalBalance.toFixed(2)}`}
                sub="deposited in vault"
                accent
              />
              <StatCard
                label="Available"
                value={`$${availableBalance.toFixed(2)}`}
                sub="free to allocate"
              />
              <StatCard
                label="Locked in Strategies"
                value={`$${lockedAmount.toFixed(2)}`}
                sub="across active positions"
              />
              <StatCard
                label="Total Earned"
                value={`$${totalEarned.toFixed(4)}`}
                sub="yield accumulated"
                accent
              />
            </div>

            {/* Allocation bar */}
            {totalBalance > 0 && (
              <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                <div className="flex justify-between text-xs text-[#A3A3A3] mb-2">
                  <span className="flex items-center gap-1.5"><Lock size={11} /> Locked ({((lockedAmount / totalBalance) * 100).toFixed(0)}%)</span>
                  <span className="flex items-center gap-1.5">Available ({((availableBalance / totalBalance) * 100).toFixed(0)}%) <TrendingUp size={11} /></span>
                </div>
                <div className="h-3 rounded-full bg-[#262626] overflow-hidden flex">
                  <div
                    className="bg-[#10B981] h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${(lockedAmount / totalBalance) * 100}%` }}
                  />
                  <div
                    className="bg-[#4edea3]/40 h-full transition-all duration-500"
                    style={{ width: `${(availableBalance / totalBalance) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-[#10B981]"><span className="w-2 h-2 rounded-sm bg-[#10B981]" />Locked in strategies</span>
                  <span className="flex items-center gap-1 text-[#4edea3]"><span className="w-2 h-2 rounded-sm bg-[#4edea3]/40" />Available</span>
                </div>
              </div>
            )}

            {/* Main grid */}
            <div className="grid md:grid-cols-2 gap-5">
              <DepositWithdraw />
              <ActiveStrategies />
            </div>

            {/* Transaction history */}
            <TransactionHistory />
          </div>
        )}
      </main>
    </div>
  );
}
