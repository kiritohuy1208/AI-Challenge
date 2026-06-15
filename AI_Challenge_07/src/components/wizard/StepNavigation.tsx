import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TOTAL_WIZARD_STEPS } from '@/constants/wizardSteps'
import type { WizardStep } from '@/types'

interface StepNavigationProps {
  currentStep: WizardStep
  onBack: () => void
  isNextDisabled?: boolean
}

export function StepNavigation({
  currentStep,
  onBack,
  isNextDisabled = false,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_WIZARD_STEPS

  return (
    <div className="flex flex-col-reverse gap-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep}
          className="w-full sm:w-auto"
          aria-label="Go to previous step"
        >
          <ChevronLeft aria-hidden />
          Back
        </Button>

        {!isLastStep ? (
          <Button
            type="submit"
            disabled={isNextDisabled}
            className="w-full sm:w-auto"
            aria-label="Go to next step"
            aria-describedby={isNextDisabled ? 'primary-action-hint' : undefined}
          >
            Next
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNextDisabled}
            className="w-full sm:w-auto"
            aria-label="Submit claim"
            aria-describedby={isNextDisabled ? 'primary-action-hint' : undefined}
          >
            Submit
            <Send aria-hidden />
          </Button>
        )}
      </div>

      {isNextDisabled && (
        <p
          id="primary-action-hint"
          className="text-center text-xs text-muted-foreground sm:text-right"
        >
          {isLastStep ? (
            <>
              Confirm the information is accurate and ensure all prior steps are complete to
              submit.
            </>
          ) : (
            <>
              Complete all required fields marked with{' '}
              <span className="text-destructive" aria-hidden>
                *
              </span>{' '}
              to continue.
            </>
          )}
        </p>
      )}
    </div>
  )
}
