'use client';

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getProgram, getPositionPDA } from '@/lib/program';
import { PAIRS } from '@/lib/constants';
import { PublicKey, SystemProgram } from '@solana/web3.js';

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

export function useStrategy() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [position, setPosition] = useState<PositionState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const createPosition = useCallback(async (args: CreatePositionArgs) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = getProgram(provider);
      const pairInfo = PAIRS.find((p) => p.id === args.pair);
      if (!pairInfo) throw new Error('Unknown pair');

      const tokenAMint = new PublicKey(pairInfo.mintA);
      const tokenBMint = new PublicKey(pairInfo.mintB);
      const [positionPDA] = getPositionPDA(wallet.publicKey, tokenAMint, tokenBMint);

      // In a full implementation this would call program.methods.createPosition(...)
      // For the demo we simulate success after a short delay
      await new Promise((res) => setTimeout(res, 1500));

      setPosition({
        pair: args.pair,
        amount: args.amount,
        intervalMinutes: args.intervalMinutes,
        accumulatedYield: 0,
        solFeesPaid: 0,
        realisedIL: 0,
      });
      setIsRunning(true);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  const toggleKeeper = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Simulate yield accumulation when keeper is running
  useState(() => {
    if (!isRunning || !position) return;
    const id = setInterval(() => {
      setPosition((prev) => prev ? {
        ...prev,
        accumulatedYield: prev.accumulatedYield + 0.000028,
        solFeesPaid: prev.solFeesPaid + 0.0000005,
      } : null);
    }, 3000);
    return () => clearInterval(id);
  });

  return { position, isRunning, loading, createPosition, toggleKeeper };
}
