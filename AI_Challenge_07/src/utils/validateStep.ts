import type {
  FieldPath,
  UseFormClearErrors,
  UseFormSetError,
  UseFormSetValue,
} from 'react-hook-form'

import { STEP_SCHEMAS } from '@/schemas/wizardSchemas'
import type { WizardFormValues, WizardStep } from '@/types'
import {
  applyIcd10ExactCodeResolution,
  getStepValidationFieldPaths,
  pickStepValues,
} from '@/utils/stepValidation'

function syncIcd10ExactCode(
  values: WizardFormValues,
  setValue: UseFormSetValue<WizardFormValues>,
): WizardFormValues {
  const resolved = applyIcd10ExactCodeResolution(values)

  if (
    resolved.icd10Code !== values.icd10Code ||
    resolved.icd10Description !== values.icd10Description
  ) {
    setValue('icd10Code', resolved.icd10Code, { shouldDirty: true, shouldValidate: false })
    setValue('icd10Description', resolved.icd10Description, {
      shouldDirty: true,
      shouldValidate: false,
    })
  }

  return resolved
}

export async function validateWizardStep(
  step: WizardStep,
  values: WizardFormValues,
  setError: UseFormSetError<WizardFormValues>,
  clearErrors: UseFormClearErrors<WizardFormValues>,
  setValue?: UseFormSetValue<WizardFormValues>,
): Promise<boolean> {
  const schema = STEP_SCHEMAS[step]
  const fields = getStepValidationFieldPaths(step, values)

  if (!schema || fields.length === 0) {
    return true
  }

  let valuesToValidate = values

  if (step === 3 && setValue) {
    valuesToValidate = syncIcd10ExactCode(values, setValue)
  } else if (step === 3) {
    valuesToValidate = applyIcd10ExactCodeResolution(values)
  }

  clearErrors(fields as FieldPath<WizardFormValues>[])

  const result = schema.safeParse(pickStepValues(step, valuesToValidate))

  if (result.success) {
    return true
  }

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      continue
    }

    const fieldPath = issue.path.join('.') as FieldPath<WizardFormValues>

    setError(fieldPath, {
      type: 'manual',
      message: issue.message,
    })
  }

  return false
}
