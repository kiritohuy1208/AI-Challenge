import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { Autocomplete } from '@/components/ui/Autocomplete'
import { Icd10Autocomplete } from '@/components/ui/Icd10Autocomplete'
import { fieldInputClassName, FormField } from '@/components/ui/form-field'
import { filterProviders } from '@/data/mockData'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useStep3DateValidation } from '@/hooks/useStep3DateValidation'
import { cn } from '@/lib/utils'
import type { WizardFormValues } from '@/types'
import { calculateLengthOfStay, DISCHARGE_BEFORE_ADMISSION_ERROR } from '@/utils/dateUtils'

export function Step3DiagnosisTreatment() {
  const {
    register,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const claimType = watch('claimType')
  const admissionDate = watch('admissionDate')
  const dischargeDate = watch('dischargeDate')
  const providerName = watch('providerName')

  const [providerQuery, setProviderQuery] = useState('')
  const debouncedProviderQuery = useDebouncedValue(providerQuery, 200)
  const providerOptions = filterProviders(debouncedProviderQuery, 8)

  useEffect(() => {
    setProviderQuery(providerName)
    // Restore display values when returning to this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (claimType !== 'INPATIENT') {
      return
    }

    const lengthOfStay = calculateLengthOfStay(admissionDate, dischargeDate)
    setValue('lengthOfStay', lengthOfStay, { shouldDirty: true })
  }, [admissionDate, dischargeDate, claimType, setValue])

  const lengthOfStay = watch('lengthOfStay')
  const isInpatient = claimType === 'INPATIENT'
  const isOutpatientOrDental = claimType === 'OUTPATIENT' || claimType === 'DENTAL'
  const showDateRangeError =
    errors.dischargeDate?.message === DISCHARGE_BEFORE_ADMISSION_ERROR

  useStep3DateValidation()

  const handleProviderSelect = (name: string) => {
    setValue('providerName', name, { shouldDirty: true, shouldValidate: false })
    setProviderQuery(name)
    clearErrors('providerName')
  }

  const handleProviderInputChange = (value: string) => {
    setProviderQuery(value)
    setValue('providerName', value, { shouldDirty: true, shouldValidate: false })

    if (value.trim()) {
      clearErrors('providerName')
    }
  }

  return (
    <div className="space-y-6">
      <input type="hidden" {...register('icd10Code')} />
      <input type="hidden" {...register('icd10Description')} />
      <input type="hidden" {...register('providerName')} />

      <FormField
        id="diagnosisDescription"
        label="Diagnosis description"
        required
        error={errors.diagnosisDescription?.message}
      >
        <textarea
          {...register('diagnosisDescription')}
          id="diagnosisDescription"
          rows={3}
          placeholder="Describe the diagnosis or reason for treatment"
          aria-invalid={errors.diagnosisDescription ? true : undefined}
          className={textareaClassName}
        />
      </FormField>

      <Icd10Autocomplete error={errors.icd10Code?.message} />

      <Autocomplete
        id="provider-search"
        label="Provider / hospital"
        required
        placeholder="Enter or search for a provider"
        value={providerQuery}
        onValueChange={handleProviderInputChange}
        onSelect={handleProviderSelect}
        options={providerOptions}
        getOptionKey={(option) => option}
        getOptionLabel={(option) => option}
        error={errors.providerName?.message}
      />

      {isOutpatientOrDental && (
        <FormField
          id="treatmentDate"
          label="Treatment date"
          required
          error={errors.treatmentDate?.message}
          className="sm:max-w-xs"
        >
          <input
            {...register('treatmentDate')}
            id="treatmentDate"
            type="date"
            aria-invalid={errors.treatmentDate ? true : undefined}
            className={fieldInputClassName}
          />
        </FormField>
      )}

      {isInpatient && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Inpatient stay details</h3>

          <div
            className={cn(
              'grid gap-4 sm:grid-cols-2',
              showDateRangeError && 'rounded-lg ring-1 ring-destructive/30',
            )}
          >
            <FormField
              id="admissionDate"
              label="Admission date"
              required
              error={errors.admissionDate?.message}
            >
              <input
                {...register('admissionDate')}
                id="admissionDate"
                type="date"
                aria-invalid={
                  errors.admissionDate || showDateRangeError ? true : undefined
                }
                className={fieldInputClassName}
              />
            </FormField>

            <FormField
              id="dischargeDate"
              label="Discharge date"
              required
              error={showDateRangeError ? undefined : errors.dischargeDate?.message}
            >
              <input
                {...register('dischargeDate')}
                id="dischargeDate"
                type="date"
                aria-invalid={
                  errors.dischargeDate || showDateRangeError ? true : undefined
                }
                className={fieldInputClassName}
              />
            </FormField>
          </div>

          {showDateRangeError && (
            <p
              id="inpatient-date-range-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {DISCHARGE_BEFORE_ADMISSION_ERROR}
            </p>
          )}

          <FormField
            id="lengthOfStay"
            label="Length of stay (days)"
            description="Auto-calculated from admission and discharge dates (inclusive)"
          >
            <input
              id="lengthOfStay"
              type="text"
              readOnly
              value={lengthOfStay ?? ''}
              placeholder="—"
              className={cn(
                fieldInputClassName,
                'bg-muted text-muted-foreground sm:max-w-xs',
              )}
            />
          </FormField>

          <FormField
            id="admissionReason"
            label="Admission reason"
            required
            error={errors.admissionReason?.message}
          >
            <textarea
              {...register('admissionReason')}
              id="admissionReason"
              rows={2}
              placeholder="Reason for hospital admission"
              aria-invalid={errors.admissionReason ? true : undefined}
              className={textareaClassName}
            />
          </FormField>
        </div>
      )}
    </div>
  )
}

const textareaClassName =
  'flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'
