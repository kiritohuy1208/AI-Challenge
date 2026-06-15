import { useFormContext } from 'react-hook-form'

import { useDocumentUpload } from '@/context/DocumentUploadContext'
import type { WizardFormValues } from '@/types'
import { isCurrentStepValid } from '@/utils/stepValidation'

/**
 * Reactive guard for the global Next button — re-evaluates whenever watched
 * form fields or upload state change.
 */
export function useIsCurrentStepValid(): boolean {
  const { watch } = useFormContext<WizardFormValues>()
  const { isAnyUploading } = useDocumentUpload()

  const currentStep = watch('currentStep')
  const claimType = watch('claimType')
  const isClaimForDependent = watch('isClaimForDependent')
  const dependentId = watch('dependentId')
  const memberName = watch('memberName')
  const policyNumber = watch('policyNumber')
  const memberId = watch('memberId')
  const dateOfBirth = watch('dateOfBirth')
  const diagnosisDescription = watch('diagnosisDescription')
  const icd10Code = watch('icd10Code')
  const icd10Description = watch('icd10Description')
  const providerName = watch('providerName')
  const treatmentDate = watch('treatmentDate')
  const admissionDate = watch('admissionDate')
  const dischargeDate = watch('dischargeDate')
  const admissionReason = watch('admissionReason')
  const isMajorDental = watch('isMajorDental')
  const documents = watch('documents')

  const values: WizardFormValues = {
    currentStep,
    claimType,
    isClaimForDependent,
    dependentId,
    memberName,
    policyNumber,
    memberId,
    dateOfBirth,
    diagnosisDescription,
    icd10Code,
    icd10Description,
    providerName,
    treatmentDate,
    admissionDate,
    dischargeDate,
    lengthOfStay: watch('lengthOfStay'),
    admissionReason,
    isMajorDental,
    documents,
    confirmationChecked: watch('confirmationChecked'),
  }

  return isCurrentStepValid(currentStep, values, { isAnyUploading })
}
