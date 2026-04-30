'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Step1PairSelect } from './Step1PairSelect';
import { Step2Configure } from './Step2Configure';
import { Step3Confirm } from './Step3Confirm';
import { useStrategy } from '@/hooks/useStrategy';
import { ChevronLeft } from 'lucide-react';

const STEPS = ['Choose pair', 'Configure', 'Confirm'];

export function StrategyWizard() {
  const router = useRouter();
  const { createPosition } = useStrategy();

  const [step, setStep] = useState(0);
  const [pair, setPair] = useState('USDC/USDT');
  const [amount, setAmount] = useState(500);
  const [interval, setInterval] = useState(30);

  async function handleConfirm() {
    await createPosition({ pair, amount, intervalMinutes: interval });
    router.push('/app/position');
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center py-12 px-4">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="text-gray-400 hover:text-white transition-colors mr-1">
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-1 flex-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    i < step ? 'bg-brand-500 text-white' :
                    i === step ? 'border-2 border-brand-500 text-brand-400' :
                    'border border-surface-600 text-gray-500'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-white font-medium' : 'text-gray-500'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-brand-500' : 'bg-surface-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-xl">
        {step === 0 && <Step1PairSelect selected={pair} onSelect={setPair} />}
        {step === 1 && (
          <Step2Configure
            amount={amount}
            interval={interval}
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
            className="mt-6 w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
