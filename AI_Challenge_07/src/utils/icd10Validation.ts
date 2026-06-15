import { getIcd10ByCode } from '@/data/mockData'
import type { Icd10Code } from '@/types'

export const ICD10_SELECTION_ERROR =
  'Please select or type a valid ICD-10 code from the list.'

/** Exact code match (case-insensitive) against mock data. */
export function resolveExactIcd10Code(input: string): Icd10Code | undefined {
  const trimmed = input.trim()

  if (!trimmed) {
    return undefined
  }

  const match = getIcd10ByCode(trimmed)

  if (!match) {
    return undefined
  }

  return trimmed.toLowerCase() === match.code.toLowerCase() ? match : undefined
}

export function isValidIcd10Selection(
  code: string,
  description: string,
): boolean {
  const match = getIcd10ByCode(code)

  return Boolean(match && match.description === description)
}

export { getIcd10ByCode }
