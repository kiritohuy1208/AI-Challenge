import { z } from 'zod'

import { getRequiredDocuments, mockDependents } from '@/data/mockData'
import type { ClaimType, WizardFormValues, WizardStep } from '@/types'
import {
  isDateNotInFuture,
  isValidDateString,
  ADMISSION_DATE_FUTURE_ERROR,
  DISCHARGE_DATE_FUTURE_ERROR,
  DISCHARGE_BEFORE_ADMISSION_ERROR,
  TREATMENT_DATE_FUTURE_ERROR,
} from '@/utils/dateUtils'
import { ICD10_SELECTION_ERROR, isValidIcd10Selection, resolveExactIcd10Code } from '@/utils/icd10Validation'

const dependentIds = mockDependents.map((dependent) => dependent.id)

export const claimTypeSchema = z.enum(['OUTPATIENT', 'INPATIENT', 'DENTAL'])

export const step1Schema = z.object({
  claimType: z.enum(['OUTPATIENT', 'INPATIENT', 'DENTAL'], {
    message: 'Please select a claim type',
  }),
})

export const step2Schema = z
  .object({
    memberName: z.string().trim().min(1, 'Member name is required'),
    policyNumber: z.string().trim().min(1, 'Policy number is required'),
    memberId: z.string().trim().min(1, 'Member ID is required'),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'Enter a valid date of birth',
      })
      .refine((value) => new Date(value) <= new Date(), {
        message: 'Date of birth cannot be in the future',
      }),
    isClaimForDependent: z.boolean(),
    dependentId: z.string().nullable(),
  })
  .superRefine((data, context) => {
    if (data.isClaimForDependent && !data.dependentId) {
      context.addIssue({
        code: 'custom',
        message: 'Please select a dependent',
        path: ['dependentId'],
      })
      return
    }

    if (
      data.isClaimForDependent &&
      data.dependentId &&
      !dependentIds.includes(data.dependentId)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Selected dependent is not valid',
        path: ['dependentId'],
      })
    }
  })

export const step3Schema = z
  .object({
    claimType: claimTypeSchema,
    diagnosisDescription: z
      .string()
      .trim()
      .min(1, 'Diagnosis description is required'),
    icd10Code: z
      .string()
      .trim()
      .min(1, ICD10_SELECTION_ERROR),
    icd10Description: z.string().trim().min(1, ICD10_SELECTION_ERROR),
    providerName: z.string().trim().min(1, 'Provider/hospital name is required'),
    treatmentDate: z.string(),
    admissionDate: z.string(),
    dischargeDate: z.string(),
    admissionReason: z.string(),
  })
  .superRefine((data, context) => {
    const icd10Valid =
      isValidIcd10Selection(data.icd10Code, data.icd10Description) ||
      Boolean(resolveExactIcd10Code(data.icd10Code))

    if (!icd10Valid) {
      context.addIssue({
        code: 'custom',
        message: ICD10_SELECTION_ERROR,
        path: ['icd10Code'],
      })
    }

    if (data.claimType === 'OUTPATIENT' || data.claimType === 'DENTAL') {
      if (!data.treatmentDate) {
        context.addIssue({
          code: 'custom',
          message: 'Treatment date is required',
          path: ['treatmentDate'],
        })
      } else if (!isValidDateString(data.treatmentDate)) {
        context.addIssue({
          code: 'custom',
          message: 'Enter a valid treatment date',
          path: ['treatmentDate'],
        })
      } else if (!isDateNotInFuture(data.treatmentDate)) {
        context.addIssue({
          code: 'custom',
          message: TREATMENT_DATE_FUTURE_ERROR,
          path: ['treatmentDate'],
        })
      }
    }

    if (data.claimType === 'INPATIENT') {
      if (!data.admissionDate) {
        context.addIssue({
          code: 'custom',
          message: 'Admission date is required',
          path: ['admissionDate'],
        })
      } else if (!isValidDateString(data.admissionDate)) {
        context.addIssue({
          code: 'custom',
          message: 'Enter a valid admission date',
          path: ['admissionDate'],
        })
      } else if (!isDateNotInFuture(data.admissionDate)) {
        context.addIssue({
          code: 'custom',
          message: ADMISSION_DATE_FUTURE_ERROR,
          path: ['admissionDate'],
        })
      }

      if (!data.dischargeDate) {
        context.addIssue({
          code: 'custom',
          message: 'Discharge date is required',
          path: ['dischargeDate'],
        })
      } else if (!isValidDateString(data.dischargeDate)) {
        context.addIssue({
          code: 'custom',
          message: 'Enter a valid discharge date',
          path: ['dischargeDate'],
        })
      } else if (!isDateNotInFuture(data.dischargeDate)) {
        context.addIssue({
          code: 'custom',
          message: DISCHARGE_DATE_FUTURE_ERROR,
          path: ['dischargeDate'],
        })
      }

      if (
        isValidDateString(data.admissionDate) &&
        isValidDateString(data.dischargeDate) &&
        data.dischargeDate < data.admissionDate
      ) {
        context.addIssue({
          code: 'custom',
          message: DISCHARGE_BEFORE_ADMISSION_ERROR,
          path: ['dischargeDate'],
        })
      }

      if (!data.admissionReason.trim()) {
        context.addIssue({
          code: 'custom',
          message: 'Admission reason is required',
          path: ['admissionReason'],
        })
      }
    }
  })

const uploadedDocumentSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string(),
})

export const step4Schema = z
  .object({
    claimType: claimTypeSchema,
    isMajorDental: z.boolean(),
    documents: z.record(z.string(), uploadedDocumentSchema.optional()),
  })
  .superRefine((data, context) => {
    const requiredDocuments = getRequiredDocuments(data.claimType, data.isMajorDental)

    for (const entry of requiredDocuments) {
      const document = data.documents[entry.type]

      if (!document?.fileName) {
        context.addIssue({
          code: 'custom',
          message: `${entry.label} is required`,
          path: ['documents', entry.type],
        })
      }
    }
  })

export const step5Schema = z.object({
  confirmationChecked: z.literal(true, {
    message: 'Please confirm the information is accurate',
  }),
})

export const STEP_SCHEMAS: Partial<
  Record<WizardStep, z.ZodType<Record<string, unknown>>>
> = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
}

export const STEP_FIELD_NAMES: Partial<
  Record<WizardStep, (keyof WizardFormValues)[]>
> = {
  1: ['claimType'],
  2: [
    'memberName',
    'policyNumber',
    'memberId',
    'dateOfBirth',
    'isClaimForDependent',
    'dependentId',
  ],
  3: [
    'claimType',
    'diagnosisDescription',
    'icd10Code',
    'icd10Description',
    'providerName',
    'treatmentDate',
    'admissionDate',
    'dischargeDate',
    'admissionReason',
  ],
  4: ['claimType', 'isMajorDental', 'documents'],
  5: ['confirmationChecked'],
}

export const CLAIM_TYPE_OPTIONS: Array<{
  value: ClaimType
  label: string
  description: string
}> = [
  {
    value: 'OUTPATIENT',
    label: 'Outpatient',
    description: 'Clinic visits, lab tests, and same-day care',
  },
  {
    value: 'INPATIENT',
    label: 'Inpatient',
    description: 'Hospital admission with overnight stay',
  },
  {
    value: 'DENTAL',
    label: 'Dental',
    description: 'Dental treatments and procedures',
  },
]
