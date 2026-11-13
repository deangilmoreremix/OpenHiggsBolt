'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { STEPS, type StepId } from './types';

interface SocialPublishStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function SocialPublishStepper({ currentStep, onStepClick }: SocialPublishStepperProps) {
  return (
    <nav aria-label="Publish steps" className="flex items-center gap-1">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const handleStepClick = onStepClick && isCompleted ? onStepClick : undefined;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              handleStepClick?.(index);
            }}
            aria-current={isCurrent ? 'step' : undefined}
            aria-selected={isCurrent}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all
              ${isCurrent
                ? 'bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30'
                : isCompleted
                  ? 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                  : 'text-white/30 border border-transparent'
              }
              ${!handleStepClick ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                flex items-center justify-center w-4 h-4 rounded-full text-[10px]
                ${isCompleted
                  ? 'bg-[#22d3ee]/10 text-[#22d3ee] ring-1 ring-inset ring-[#22d3ee]/40 hover:bg-[#22d3ee]/20'
                  : isCurrent
                    ? 'border border-[#22d3ee]/50 text-[#22d3ee]'
                    : 'border border-white/20 text-white/30'
                }
              `}
            >
              {isCompleted ? <Check size={10} strokeWidth={3} /> : index + 1}
            </span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}
