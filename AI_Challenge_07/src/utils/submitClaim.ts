import {
  getDependentById,
  getVisibleDocumentEntries,
} from '@/data/mockData'
import type { ClaimSubmissionPayload, ClaimType, WizardFormValues } from '@/types'

/** Build the mock API payload from full wizard form state. */
export function buildClaimSubmissionPayload(
  values: WizardFormValues,
): ClaimSubmissionPayload {
  const claimType = values.claimType as ClaimType

  const dependent =
    values.isClaimForDependent && values.dependentId
      ? getDependentById(values.dependentId) ?? null
      : null

  const diagnosis: ClaimSubmissionPayload['diagnosis'] = {
    description: values.diagnosisDescription,
    icd10Code: values.icd10Code,
    icd10Description: values.icd10Description,
    providerName: values.providerName,
  }

  if (claimType === 'OUTPATIENT' || claimType === 'DENTAL') {
    diagnosis.treatmentDate = values.treatmentDate
  }

  if (claimType === 'INPATIENT') {
    diagnosis.admissionDate = values.admissionDate
    diagnosis.dischargeDate = values.dischargeDate
    diagnosis.lengthOfStay = values.lengthOfStay
    diagnosis.admissionReason = values.admissionReason
  }

  if (claimType === 'DENTAL') {
    diagnosis.isMajorDental = values.isMajorDental
  }

  const visibleDocuments = getVisibleDocumentEntries(claimType, values.isMajorDental)

  const documents = visibleDocuments
    .map((entry) => {
      const upload = values.documents[entry.type]

      if (!upload?.fileName) {
        return null
      }

      return {
        type: entry.type,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        fileType: upload.fileType,
      }
    })
    .filter((document): document is NonNullable<typeof document> => document !== null)

  return {
    claimType,
    member: {
      memberName: values.memberName,
      policyNumber: values.policyNumber,
      memberId: values.memberId,
      dateOfBirth: values.dateOfBirth,
    },
    isClaimForDependent: values.isClaimForDependent,
    dependent,
    diagnosis,
    documents,
    submittedAt: new Date().toISOString(),
  }
}

/** Mock submit — logs payload to console for evaluation. */
export function submitClaim(payload: ClaimSubmissionPayload): void {
  console.log('Claim submission payload:', payload)
}
