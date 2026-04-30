'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { RebalanceEvent } from '@/components/PositionDashboard/RebalanceHistory';

function mockEvents(): RebalanceEvent[] {
  const now = Date.now();
  return Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    timestamp: new Date(now - i * 18 * 60 * 1000).toLocaleTimeString(),
    trigger: i % 3 === 0 ? 'price' : 'timer',
    newCenterPrice: 1.00002 + (Math.random() - 0.5) * 0.00003,
    yield: 0.000024 + Math.random() * 0.00001,
    feeCost: 0.000006 + Math.random() * 0.000002,
    txSig: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
  }));
}

export function useRebalanceHistory() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [events, setEvents] = useState<RebalanceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    // In production: fetch RebalanceLog accounts filtered by owner via getProgramAccounts
    setTimeout(() => {
      setEvents(mockEvents());
      setLoading(false);
    }, 800);
  }, [publicKey?.toBase58()]);

  return { events, loading };
}
