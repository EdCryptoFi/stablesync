'use client';

import { useVault } from '@/contexts/VaultContext';
import { useStrategy } from '@/contexts/StrategyContext';

export function useVaultBalance() {
  const { balance } = useVault();
  const { positions } = useStrategy();
  const lockedAmount = positions.reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = Math.max(0, balance - lockedAmount);
  const totalEarned = positions.reduce((sum, p) => sum + p.accumulatedYield, 0);
  return { totalBalance: balance, lockedAmount, availableBalance, totalEarned };
}
