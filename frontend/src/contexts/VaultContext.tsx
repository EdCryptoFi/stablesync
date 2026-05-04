'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  timestamp: number;
  txSig?: string;
}

interface VaultState {
  balance: number;
  transactions: VaultTransaction[];
}

interface VaultContextValue {
  balance: number;
  transactions: VaultTransaction[];
  loading: boolean;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

const STORAGE_KEY = 'stablesync_vault_v1';

function loadState(): VaultState {
  if (typeof window === 'undefined') return { balance: 0, transactions: [] };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { balance: 0, transactions: [] };
  } catch {
    return { balance: 0, transactions: [] };
  }
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [state, setState] = useState<VaultState>(loadState);
  const [loading, setLoading] = useState(false);

  function persist(next: VaultState) {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const deposit = useCallback(
    async (amount: number) => {
      if (!wallet.signMessage) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const msg = new TextEncoder().encode(
          `StableSync Vault: deposit $${amount.toFixed(2)} USDC`,
        );
        const sigBytes = await wallet.signMessage(msg);
        const txSig = Buffer.from(sigBytes).toString('hex').slice(0, 64);
        const tx: VaultTransaction = {
          id: Date.now().toString(),
          type: 'deposit',
          amount,
          timestamp: Date.now(),
          txSig,
        };
        persist({
          balance: state.balance + amount,
          transactions: [tx, ...state.transactions],
        });
      } finally {
        setLoading(false);
      }
    },
    [wallet, state],
  );

  const withdraw = useCallback(
    async (amount: number) => {
      if (!wallet.signMessage) throw new Error('Wallet not connected');
      if (amount > state.balance) throw new Error('Insufficient vault balance');
      setLoading(true);
      try {
        const msg = new TextEncoder().encode(
          `StableSync Vault: withdraw $${amount.toFixed(2)} USDC`,
        );
        const sigBytes = await wallet.signMessage(msg);
        const txSig = Buffer.from(sigBytes).toString('hex').slice(0, 64);
        const tx: VaultTransaction = {
          id: Date.now().toString(),
          type: 'withdraw',
          amount,
          timestamp: Date.now(),
          txSig,
        };
        persist({
          balance: state.balance - amount,
          transactions: [tx, ...state.transactions],
        });
      } finally {
        setLoading(false);
      }
    },
    [wallet, state],
  );

  return (
    <VaultContext.Provider value={{ balance: state.balance, transactions: state.transactions, loading, deposit, withdraw }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used inside VaultProvider');
  return ctx;
}
