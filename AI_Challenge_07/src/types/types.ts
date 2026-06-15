/** Claim categories — drives conditional fields and document requirements. */
export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL'

/** Wizard step numbers (1–5). */
export type WizardStep = 1 | 2 | 3 | 4 | 5

/** Upload slots referenced in Step 4. */
export type DocumentType =
  | 'MEDICAL_RECEIPT'
  | 'PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'ITEMIZED_BILL'
  | 'DENTAL_RECEIPT'
  | 'TREATMENT_PLAN'

export type DocumentRequirement = 'required' | 'optional'

/** Primary policyholder — pre-filled in Step 2. */
export interface Member {
  memberName: string
  policyNumber: string
  memberId: string
  dateOfBirth: string
}

/** Dependent covered under the member's policy. */
export interface Dependent {
  id: string
  name: string
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Other'
  dateOfBirth: string
}

/** ICD-10 diagnosis code for autocomplete (Step 3). */
export interface Icd10Code {
  code: string
  description: string
}

/** Client-side upload metadata stored in form state (Step 4). */
export interface UploadedDocument {
  file: File | null
  fileName: string
  fileSize: number
  fileType: string
}

/** Per-claim-type document matrix entry. */
export interface DocumentConfigEntry {
  type: DocumentType
  label: string
  requirement: DocumentRequirement
  /** When set, requirement applies only if this flag is true on the form. */
  requiredWhen?: 'isMajorDental'
}

/** Maps each claim type to its Step 4 document list. */
export type DocumentConfig = Record<ClaimType, DocumentConfigEntry[]>

/**
 * Full multi-step wizard form state (react-hook-form values).
 * Conditional fields by claim type:
 * - OUTPATIENT / DENTAL: `treatmentDate`
 * - INPATIENT: `admissionDate`, `dischargeDate`, `lengthOfStay`, `admissionReason`
 * - DENTAL: `isMajorDental` (treatment plan required when true)
 */
export interface WizardFormValues {
  currentStep: WizardStep
  claimType: ClaimType | ''

  // Step 2 — member & policy
  isClaimForDependent: boolean
  dependentId: string | null
  memberName: string
  policyNumber: string
  memberId: string
  dateOfBirth: string

  // Step 3 — diagnosis & treatment (shared)
  diagnosisDescription: string
  icd10Code: string
  icd10Description: string
  providerName: string

  // Step 3 — outpatient & dental
  treatmentDate: string

  // Step 3 — inpatient only
  admissionDate: string
  dischargeDate: string
  lengthOfStay: number | null
  admissionReason: string

  // Step 3/4 — dental only
  isMajorDental: boolean

  // Step 4 — documents keyed by DocumentType
  documents: Partial<Record<DocumentType, UploadedDocument>>

  // Step 5 — review & submit
  confirmationChecked: boolean
}

/** Payload logged on mock submit. */
export interface ClaimSubmissionPayload {
  claimType: ClaimType
  member: Pick<WizardFormValues, 'memberName' | 'policyNumber' | 'memberId' | 'dateOfBirth'>
  isClaimForDependent: boolean
  dependent: Dependent | null
  diagnosis: {
    description: string
    icd10Code: string
    icd10Description: string
    providerName: string
    treatmentDate?: string
    admissionDate?: string
    dischargeDate?: string
    lengthOfStay?: number | null
    admissionReason?: string
    isMajorDental?: boolean
  }
  documents: Array<{
    type: DocumentType
    fileName: string
    fileSize: number
    fileType: string
  }>
  submittedAt: string
}

/** Step 1 fields only. */
export type Step1Fields = Pick<WizardFormValues, 'claimType'>

/** Step 2 fields only. */
export type Step2Fields = Pick<
  WizardFormValues,
  | 'isClaimForDependent'
  | 'dependentId'
  | 'memberName'
  | 'policyNumber'
  | 'memberId'
  | 'dateOfBirth'
>

/** Step 3 fields — all stored; UI shows subset by claimType. */
export type Step3Fields = Pick<
  WizardFormValues,
  | 'diagnosisDescription'
  | 'icd10Code'
  | 'icd10Description'
  | 'providerName'
  | 'treatmentDate'
  | 'admissionDate'
  | 'dischargeDate'
  | 'lengthOfStay'
  | 'admissionReason'
  | 'isMajorDental'
>

/** Step 4 fields only. */
export type Step4Fields = Pick<WizardFormValues, 'documents' | 'isMajorDental'>

/** Step 5 fields only. */
export type Step5Fields = Pick<WizardFormValues, 'confirmationChecked'>

/** Fields reset when claim type changes (incompatible across types). */
export type ClaimTypeResetFields = Pick<
  WizardFormValues,
  | 'treatmentDate'
  | 'admissionDate'
  | 'dischargeDate'
  | 'lengthOfStay'
  | 'admissionReason'
  | 'isMajorDental'
  | 'documents'
>
