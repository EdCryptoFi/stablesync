'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, getPositionPDA, getConfigPDA } from '@/lib/program';
import { PAIRS, CENTER_RANGE_BPS, WING_RANGE_BPS, REBALANCE_INTERVALS } from '@/lib/constants';

export interface PositionState {
  pair: string;
  amount: number;
  intervalMinutes: number;
  accumulatedYield: number;
  solFeesPaid: number;
  realisedIL: number;
}

interface CreatePositionArgs {
  pair: string;
  amount: number;
  intervalMinutes: number;
}

interface StrategyContextValue {
  position: PositionState | null;
  isRunning: boolean;
  loading: boolean;
  createPosition: (args: CreatePositionArgs) => Promise<void>;
  toggleKeeper: () => void;
  clearPosition: () => void;
}

const StrategyContext = createContext<StrategyContextValue | null>(null);

const STORAGE_KEY = 'stablesync_position';

export function StrategyProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [position, setPosition] = useState<PositionState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Persist position to localStorage
  useEffect(() => {
    if (position) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [position]);

  // Simulate yield when keeper is running
  useEffect(() => {
    if (!isRunning || !position) return;
    const id = setInterval(() => {
      setPosition((prev) =>
        prev
          ? {
              ...prev,
              accumulatedYield: prev.accumulatedYield + 0.000028,
              solFeesPaid: prev.solFeesPaid + 0.0000005,
            }
          : null,
      );
    }, 3000);
    return () => clearInterval(id);
  }, [isRunning, position]);

  const createPosition = useCallback(
    async (args: CreatePositionArgs) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }
      setLoading(true);
      try {
        const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
        const program = getProgram(provider);
        const pairInfo = PAIRS.find((p) => p.id === args.pair);
        if (!pairInfo) throw new Error('Unknown pair');

        const validIntervals = REBALANCE_INTERVALS.map((r) => r.value);
        if (!validIntervals.includes(args.intervalMinutes)) throw new Error('Invalid interval');
        if (!Number.isFinite(args.amount) || args.amount < 100 || args.amount > 1000) throw new Error('Invalid amount');

        const tokenAMint = new PublicKey(pairInfo.mintA);
        const tokenBMint = new PublicKey(pairInfo.mintB);
        const [positionPDA] = getPositionPDA(wallet.publicKey, tokenAMint, tokenBMint);
        const [configPDA] = getConfigPDA();

        const tx = await program.methods
          .createPosition(
            new BN(args.intervalMinutes * 60),
            CENTER_RANGE_BPS,
            WING_RANGE_BPS,
          )
          .accounts({
            config: configPDA,
            position: positionPDA,
            tokenAMint,
            tokenBMint,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: 'confirmed' });

        console.log('create_position tx:', tx);

        const newPosition: PositionState = {
          pair: args.pair,
          amount: args.amount,
          intervalMinutes: args.intervalMinutes,
          accumulatedYield: 0,
          solFeesPaid: 0,
          realisedIL: 0,
        };
        setPosition(newPosition);
        setIsRunning(true);
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet],
  );

  const toggleKeeper = useCallback(() => setIsRunning((prev) => !prev), []);
  const clearPosition = useCallback(() => setPosition(null), []);

  return (
    <StrategyContext.Provider value={{ position, isRunning, loading, createPosition, toggleKeeper, clearPosition }}>
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const ctx = useContext(StrategyContext);
  if (!ctx) throw new Error('useStrategy must be used inside StrategyProvider');
  return ctx;
}
