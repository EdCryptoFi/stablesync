'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, getPositionPDA, getConfigPDA } from '@/lib/program';
import { PAIRS, CENTER_RANGE_BPS, WING_RANGE_BPS, REBALANCE_INTERVALS, PROGRAM_ID } from '@/lib/constants';

export interface PositionState {
  pair: string;
  amount: number;
  intervalMinutes: number;
  accumulatedYield: number;
  solFeesPaid: number;
  realisedIL: number;
  isRunning: boolean;
}

interface CreatePositionArgs {
  pair: string;
  amount: number;
  intervalMinutes: number;
}

interface StrategyContextValue {
  positions: PositionState[];
  loading: boolean;
  createPosition: (args: CreatePositionArgs) => Promise<void>;
  toggleKeeper: (pair: string) => void;
  closePosition: (pair: string) => Promise<void>;
  collectYield: (pair: string) => Promise<number>;
}

const StrategyContext = createContext<StrategyContextValue | null>(null);

const STORAGE_KEY = 'stablesync_positions_v2';

function loadPositions(): PositionState[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function StrategyProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [positions, setPositions] = useState<PositionState[]>(loadPositions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  // Simulate yield for all running positions
  useEffect(() => {
    const hasRunning = positions.some((p) => p.isRunning);
    if (!hasRunning) return;
    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) =>
          p.isRunning
            ? { ...p, accumulatedYield: p.accumulatedYield + 0.000028, solFeesPaid: p.solFeesPaid + 0.0000005 }
            : p,
        ),
      );
    }, 3000);
    return () => clearInterval(id);
  }, [positions]);

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

        const accountInfo = await connection.getAccountInfo(positionPDA);
        if (accountInfo === null) {
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
        }

        const newPosition: PositionState = {
          pair: args.pair,
          amount: args.amount,
          intervalMinutes: args.intervalMinutes,
          accumulatedYield: 0,
          solFeesPaid: 0,
          realisedIL: 0,
          isRunning: true,
        };
        setPositions((prev) => {
          const exists = prev.findIndex((p) => p.pair === args.pair);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = newPosition;
            return updated;
          }
          return [...prev, newPosition];
        });
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet],
  );

  const toggleKeeper = useCallback((pair: string) => {
    setPositions((prev) =>
      prev.map((p) => (p.pair === pair ? { ...p, isRunning: !p.isRunning } : p)),
    );
  }, []);

  const closePosition = useCallback(
    async (pair: string) => {
      if (!wallet.publicKey) return;
      setLoading(true);
      try {
        const pairInfo = PAIRS.find((p) => p.id === pair);
        if (pairInfo && wallet.signTransaction) {
          try {
            const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
            const program = getProgram(provider);
            const tokenAMint = new PublicKey(pairInfo.mintA);
            const tokenBMint = new PublicKey(pairInfo.mintB);
            const [positionPDA] = getPositionPDA(wallet.publicKey, tokenAMint, tokenBMint);
            const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            const [vaultA] = PublicKey.findProgramAddressSync(
              [Buffer.from('vault_a'), positionPDA.toBuffer()],
              new PublicKey(PROGRAM_ID),
            );
            const [vaultB] = PublicKey.findProgramAddressSync(
              [Buffer.from('vault_b'), positionPDA.toBuffer()],
              new PublicKey(PROGRAM_ID),
            );
            await program.methods
              .closePosition()
              .accounts({
                position: positionPDA,
                vaultTokenA: vaultA,
                vaultTokenB: vaultB,
                owner: wallet.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
              })
              .rpc({ commitment: 'confirmed' });
          } catch (e) {
            console.warn('close_position on-chain failed, clearing locally:', e);
          }
        }
        setPositions((prev) => prev.filter((p) => p.pair !== pair));
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet],
  );

  const collectYield = useCallback(
    async (pair: string): Promise<number> => {
      const pos = positions.find((p) => p.pair === pair);
      if (!pos || pos.accumulatedYield <= 0) return 0;

      // Sign a message to confirm the collect action in the wallet
      if (wallet.signMessage) {
        try {
          const msg = new TextEncoder().encode(
            `StableSync: collect $${pos.accumulatedYield.toFixed(6)} yield from ${pair} position`,
          );
          await wallet.signMessage(msg);
        } catch (e) {
          // User rejected — abort
          throw e;
        }
      }

      const collected = pos.accumulatedYield;
      setPositions((prev) =>
        prev.map((p) => (p.pair === pair ? { ...p, accumulatedYield: 0 } : p)),
      );
      return collected;
    },
    [positions, wallet],
  );

  return (
    <StrategyContext.Provider value={{ positions, loading, createPosition, toggleKeeper, closePosition, collectYield }}>
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const ctx = useContext(StrategyContext);
  if (!ctx) throw new Error('useStrategy must be used inside StrategyProvider');
  return ctx;
}
