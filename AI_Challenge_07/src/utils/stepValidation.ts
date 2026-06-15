import { getDocumentsForClaimType } from '@/data/mockData'
import { STEP_FIELD_NAMES, STEP_SCHEMAS } from '@/schemas/wizardSchemas'
import type { ClaimType, WizardFormValues, WizardStep } from '@/types'
import {
  isValidIcd10Selection,
  resolveExactIcd10Code,
} from '@/utils/icd10Validation'

export function pickStepValues(
  step: WizardStep,
  values: WizardFormValues,
): Record<string, unknown> {
  const fields = STEP_FIELD_NAMES[step] ?? []
  return Object.fromEntries(fields.map((field) => [field, values[field]]))
}

/** Resolve exact ICD-10 code for guard checks without mutating form state. */
export function applyIcd10ExactCodeResolution(
  values: WizardFormValues,
): WizardFormValues {
  if (isValidIcd10Selection(values.icd10Code, values.icd10Description)) {
    return values
  }

  const resolved = resolveExactIcd10Code(values.icd10Code)

  if (!resolved) {
    return values
  }

  return {
    ...values,
    icd10Code: resolved.code,
    icd10Description: resolved.description,
  }
}

export interface StepValidationGuardOptions {
  isAnyUploading?: boolean
}

function validateStepSchema(
  step: WizardStep,
  values: WizardFormValues,
  options: StepValidationGuardOptions = {},
): boolean {
  const schema = STEP_SCHEMAS[step]
  const fields = STEP_FIELD_NAMES[step]

  if (!schema || !fields) {
    return true
  }

  let valuesToValidate = values

  if (step === 3) {
    valuesToValidate = applyIcd10ExactCodeResolution(values)
  }

  const result = schema.safeParse(pickStepValues(step, valuesToValidate))

  if (!result.success) {
    return false
  }

  if (step === 4 && options.isAnyUploading) {
    return false
  }

  return true
}

/** Steps 1–4 valid + confirmation checked — required before Submit. */
export function isWizardReadyToSubmit(
  values: WizardFormValues,
  options: StepValidationGuardOptions = {},
): boolean {
  if (!values.confirmationChecked) {
    return false
  }

  const priorSteps: WizardStep[] = [1, 2, 3, 4]

  return priorSteps.every((step) => validateStepSchema(step, values, options))
}

/**
 * Returns true when the current step satisfies its Zod schema and extra guards
 * (e.g. no in-flight uploads on Step 4). Used to disable the Next button reactively.
 */
export function isCurrentStepValid(
  step: WizardStep,
  values: WizardFormValues,
  options: StepValidationGuardOptions = {},
): boolean {
  if (step === 5) {
    return isWizardReadyToSubmit(values, options)
  }

  return validateStepSchema(step, values, options)
}

export function getStepValidationFieldPaths(
  step: WizardStep,
  values: WizardFormValues,
): string[] {
  const fields = STEP_FIELD_NAMES[step] ?? []
  const paths = fields.map(String)

  if (step === 4 && values.claimType) {
    const documentPaths = getDocumentsForClaimType(values.claimType as ClaimType).map(
      (entry) => `documents.${entry.type}`,
    )

    paths.push(...documentPaths)
  }

  return paths
}
