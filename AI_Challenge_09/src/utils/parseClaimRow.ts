import { parseISO } from 'date-fns';

import {
  CLAIM_STATUSES,
  CLAIM_TYPES,
  COUNTRIES,
  type Claim,
  type ClaimCsvRow,
  type ClaimStatus,
  type ClaimType,
  type Country,
} from '../types/claim';

function parseEnumValue<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return value as T;
}

export function parseClaimRow(row: ClaimCsvRow): Claim {
  const processedDateRaw = row.processed_date.trim();

  return {
    claim_id: row.claim_id,
    policy_id: row.policy_id,
    member_name: row.member_name,
    claim_type: parseEnumValue(row.claim_type, CLAIM_TYPES, 'claim_type') as ClaimType,
    diagnosis_icd10: row.diagnosis_icd10,
    submitted_amount: Number(row.submitted_amount),
    approved_amount: Number(row.approved_amount),
    status: parseEnumValue(row.status, CLAIM_STATUSES, 'status') as ClaimStatus,
    submitted_date: parseISO(row.submitted_date),
    processed_date: processedDateRaw ? parseISO(processedDateRaw) : null,
    assessor: row.assessor,
    insurer: row.insurer,
    country: parseEnumValue(row.country, COUNTRIES, 'country') as Country,
  };
}
