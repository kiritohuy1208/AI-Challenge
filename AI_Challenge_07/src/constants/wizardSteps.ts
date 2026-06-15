import type { WizardStep } from '@/types'

export interface WizardStepConfig {
  step: WizardStep
  title: string
  shortTitle: string
  description: string
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    step: 1,
    title: 'Claim Type',
    shortTitle: 'Type',
    description: 'Select outpatient, inpatient, or dental',
  },
  {
    step: 2,
    title: 'Member & Policy',
    shortTitle: 'Member',
    description: 'Member and dependent information',
  },
  {
    step: 3,
    title: 'Diagnosis & Treatment',
    shortTitle: 'Treatment',
    description: 'Diagnosis, dates, and provider',
  },
  {
    step: 4,
    title: 'Documents',
    shortTitle: 'Docs',
    description: 'Upload required documents',
  },
  {
    step: 5,
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Confirm and submit your claim',
  },
]

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length

export function getWizardStepConfig(step: WizardStep): WizardStepConfig {
  return WIZARD_STEPS[step - 1]
}
