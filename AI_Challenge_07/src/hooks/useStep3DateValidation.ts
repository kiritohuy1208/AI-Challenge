import { useEffect } from 'react'
import type { FieldPath, UseFormClearErrors, UseFormSetError } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'

import type { WizardFormValues } from '@/types'
import {
  ADMISSION_DATE_FUTURE_ERROR,
  DISCHARGE_BEFORE_ADMISSION_ERROR,
  DISCHARGE_DATE_FUTURE_ERROR,
  isDateNotInFuture,
  isDischargeOnOrAfterAdmission,
  isValidDateString,
  TREATMENT_DATE_FUTURE_ERROR,
} from '@/utils/dateUtils'

function applyFieldError(
  field: FieldPath<WizardFormValues>,
  message: string | null,
  setError: UseFormSetError<WizardFormValues>,
  clearErrors: UseFormClearErrors<WizardFormValues>,
) {
  if (message) {
    setError(field, { type: 'manual', message })
    return
  }

  clearErrors(field)
}

function resolveAdmissionDateError(admissionDate: string): string | null {
  if (!admissionDate || !isValidDateString(admissionDate)) {
    return null
  }

  if (!isDateNotInFuture(admissionDate)) {
    return ADMISSION_DATE_FUTURE_ERROR
  }

  return null
}

function resolveDischargeDateError(
  admissionDate: string,
  dischargeDate: string,
): string | null {
  if (!dischargeDate || !isValidDateString(dischargeDate)) {
    return null
  }

  if (!isDateNotInFuture(dischargeDate)) {
    return DISCHARGE_DATE_FUTURE_ERROR
  }

  if (
    admissionDate &&
    isValidDateString(admissionDate) &&
    !isDischargeOnOrAfterAdmission(admissionDate, dischargeDate)
  ) {
    return DISCHARGE_BEFORE_ADMISSION_ERROR
  }

  return null
}

/**
 * Sets inline errors immediately for Step 3 date fields (future dates + inpatient range).
 * Works alongside the Zod guard that disables the Next button.
 */
export function useStep3DateValidation() {
  const { watch, setError, clearErrors } = useFormContext<WizardFormValues>()

  const claimType = watch('claimType')
  const treatmentDate = watch('treatmentDate')
  const admissionDate = watch('admissionDate')
  const dischargeDate = watch('dischargeDate')

  useEffect(() => {
    if (claimType !== 'OUTPATIENT' && claimType !== 'DENTAL') {
      return
    }

    let treatmentError: string | null = null

    if (treatmentDate && isValidDateString(treatmentDate) && !isDateNotInFuture(treatmentDate)) {
      treatmentError = TREATMENT_DATE_FUTURE_ERROR
    }

    applyFieldError('treatmentDate', treatmentError, setError, clearErrors)
  }, [claimType, treatmentDate, setError, clearErrors])

  useEffect(() => {
    if (claimType !== 'INPATIENT') {
      return
    }

    const admissionError = resolveAdmissionDateError(admissionDate)
    const dischargeError = resolveDischargeDateError(admissionDate, dischargeDate)

    applyFieldError('admissionDate', admissionError, setError, clearErrors)
    applyFieldError('dischargeDate', dischargeError, setError, clearErrors)
  }, [claimType, admissionDate, dischargeDate, setError, clearErrors])
}
