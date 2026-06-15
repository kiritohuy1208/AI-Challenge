import { Check } from 'lucide-react'

import { WIZARD_STEPS } from '@/constants/wizardSteps'
import { cn } from '@/lib/utils'
import type { WizardStep } from '@/types'

interface StepperProps {
  currentStep: WizardStep
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <nav aria-label="Claim submission progress" className="w-full">
      <p className="mb-3 text-center text-sm font-medium text-muted-foreground sm:hidden">
        Step {currentStep} of {WIZARD_STEPS.length}:{' '}
        {WIZARD_STEPS[currentStep - 1].title}
      </p>

      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {WIZARD_STEPS.map(({ step, title, shortTitle }) => {
          const isComplete = step < currentStep
          const isCurrent = step === currentStep

          return (
            <li
              key={step}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex w-full items-center">
                {step > 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      'hidden h-0.5 flex-1 sm:block',
                      isComplete || isCurrent ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}

                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold sm:size-9 sm:text-sm',
                    isComplete &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isComplete &&
                      !isCurrent &&
                      'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isComplete ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    step
                  )}
                </span>

                {step < WIZARD_STEPS.length && (
                  <span
                    aria-hidden
                    className={cn(
                      'hidden h-0.5 flex-1 sm:block',
                      isComplete ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>

              <span className="hidden w-full truncate text-center text-xs font-medium sm:block">
                <span className={cn(isCurrent && 'text-foreground', !isCurrent && 'text-muted-foreground')}>
                  {title}
                </span>
              </span>

              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground sm:hidden">
                {shortTitle}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
