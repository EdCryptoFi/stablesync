'use client';

import { PositionDashboard } from '@/components/PositionDashboard';
import { AppNavbar } from '@/components/AppNavbar';
import Link from 'next/link';

export default function PositionPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AppNavbar active="dashboard" extra={
        <Link href="/app" className="text-xs text-[#4edea3] hover:text-white transition-colors font-manrope font-semibold">
          + New Position
        </Link>
      } />
      <main className="max-w-[1200px] mx-auto px-8 pt-24 pb-8">
        <PositionDashboard />
      </main>
    </div>
  );
}
