'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Step1PairSelect } from './Step1PairSelect';
import { Step2Configure } from './Step2Configure';
import { Step3Confirm } from './Step3Confirm';
import { useStrategy } from '@/hooks/useStrategy';
import { useVaultBalance } from '@/hooks/useVaultBalance';
import { ChevronLeft } from 'lucide-react';

const STEPS = ['Choose pair', 'Configure', 'Confirm'];

export function StrategyWizard() {
  const router = useRouter();
  const { createPosition } = useStrategy();
  const { availableBalance } = useVaultBalance();

  const [step, setStep] = useState(0);
  const [pair, setPair] = useState('USDC/USDT');
  const [amount, setAmount] = useState(500);
  const [interval, setInterval] = useState(30);

  async function handleConfirm() {
    await createPosition({ pair, amount, intervalMinutes: interval });
    router.push('/app/position');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center pt-28 pb-12 px-4">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="text-[#A3A3A3] hover:text-white transition-colors mr-1">
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-1 flex-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 font-manrope ${
                    i < step ? 'bg-[#10B981] text-black' :
                    i === step ? 'border-2 border-[#4edea3] text-[#4edea3]' :
                    'border border-[#3c4a42] text-[#A3A3A3]'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block font-manrope ${i === step ? 'text-white font-medium' : 'text-[#A3A3A3]'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-[#10B981]' : 'bg-[#3c4a42]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-[#171717] border border-[#262626] rounded-2xl p-6 shadow-xl">
        {step === 0 && <Step1PairSelect selected={pair} onSelect={setPair} />}
        {step === 1 && (
          <Step2Configure
            amount={amount}
            interval={interval}
            maxAmount={availableBalance}
            onAmountChange={setAmount}
            onIntervalChange={setInterval}
          />
        )}
        {step === 2 && (
          <Step3Confirm
            pair={pair}
            amount={amount}
            interval={interval}
            onConfirm={handleConfirm}
          />
        )}

        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && !pair}
            className="mt-6 w-full bg-[#10B981] hover:bg-[#0da06f] disabled:opacity-40 text-black font-manrope font-bold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
