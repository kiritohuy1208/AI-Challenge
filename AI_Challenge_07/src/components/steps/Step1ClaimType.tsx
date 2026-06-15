import { useEffect, useRef } from 'react'
import { BedDouble, Smile, Stethoscope } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { CLAIM_TYPE_OPTIONS } from '@/schemas/wizardSchemas'
import { cn } from '@/lib/utils'
import type { WizardFormValues } from '@/types'

const claimTypeIcons = {
  OUTPATIENT: Stethoscope,
  INPATIENT: BedDouble,
  DENTAL: Smile,
} as const

export function Step1ClaimType() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const claimType = watch('claimType')
  const previousClaimType = useRef<WizardFormValues['claimType']>(claimType)

  useEffect(() => {
    const previous = previousClaimType.current

    if (previous && previous !== claimType && claimType) {
      setValue('treatmentDate', '')
      setValue('admissionDate', '')
      setValue('dischargeDate', '')
      setValue('lengthOfStay', null)
      setValue('admissionReason', '')
      setValue('isMajorDental', false)
      setValue('documents', {})
    }

    previousClaimType.current = claimType
  }, [claimType, setValue])

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-foreground">
        Claim type
        <span className="ml-0.5 text-destructive" aria-hidden>
          *
        </span>
      </legend>
      <p className="text-xs text-muted-foreground">
        Choose the category that best describes this claim.
      </p>

      <div
        role="radiogroup"
        aria-label="Claim type"
        aria-invalid={errors.claimType ? true : undefined}
        aria-describedby={errors.claimType ? 'claim-type-error' : undefined}
        className="grid gap-3 sm:grid-cols-3"
      >
        {CLAIM_TYPE_OPTIONS.map(({ value, label, description }) => {
          const Icon = claimTypeIcons[value]
          const isSelected = claimType === value
          const inputId = `claim-type-${value.toLowerCase()}`

          return (
            <label
              key={value}
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-colors',
                'hover:border-primary/50 hover:bg-muted/40',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-background',
              )}
            >
              <input
                {...register('claimType')}
                type="radio"
                id={inputId}
                value={value}
                className="sr-only"
              />

              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>

              <span className="flex flex-col gap-1 text-left">
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {errors.claimType && (
        <p id="claim-type-error" role="alert" className="text-sm text-destructive">
          {errors.claimType.message}
        </p>
      )}
    </fieldset>
  )
}
