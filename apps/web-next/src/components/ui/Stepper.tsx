/**
 * Stepper - Multi-step progress indicator
 *
 * Figma parity: AI → Backtest → Optimize → Best-of
 * States: completed, active, disabled
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import React from 'react';

export interface StepperStep {
  id: string;
  label: string;
  completed?: boolean;
  active?: boolean;
  disabled?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  className?: string;
  onStepClick?: (stepId: string) => void;
}

export function Stepper({ steps, className, onStepClick }: StepperProps) {
  const handleKeyDown = (e: React.KeyboardEvent, step: StepperStep, index: number) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      let nextIndex = index + direction;

      // Skip disabled steps
      while (nextIndex >= 0 && nextIndex < steps.length && steps[nextIndex].disabled) {
        nextIndex += direction;
      }

      if (nextIndex >= 0 && nextIndex < steps.length && !steps[nextIndex].disabled) {
        onStepClick?.(steps[nextIndex].id);
      }
    }
  };

  return (
    // P1 FIX: overflow-x-auto ile dar ekranlarda yatay scroll (TradingView tarzı)
    <div className={cn('flex items-center gap-2 overflow-x-auto', className)} role="group" aria-label="Progress steps">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          {/* Step Circle */}
          <button
            type="button"
            onClick={() => !step.disabled && onStepClick?.(step.id)}
            onKeyDown={(e) => handleKeyDown(e, step, index)}
            disabled={step.disabled}
            aria-current={step.active ? 'step' : undefined}
            aria-disabled={step.disabled}
            className={cn(
              'flex items-center gap-2 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-950 rounded',
              step.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                step.completed
                  ? 'bg-emerald-500 text-white'
                  : step.active
                  ? 'bg-blue-500 text-white'
                  : step.disabled
                  ? 'bg-neutral-800 text-neutral-500'
                  : 'bg-neutral-800 text-neutral-400'
              )}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            {/* P1 FIX: whitespace-nowrap ile label kırılması önlenir */}
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                step.active
                  ? 'text-blue-300'
                  : step.completed
                  ? 'text-emerald-300'
                  : step.disabled
                  ? 'text-neutral-500'
                  : 'text-neutral-400'
              )}
            >
              {step.label}
            </span>
          </button>
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2',
                step.completed ? 'bg-emerald-500' : 'bg-neutral-800'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

