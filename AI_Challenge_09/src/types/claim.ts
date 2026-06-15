export const CLAIM_TYPES = [
  'OUTPATIENT',
  'INPATIENT',
  'DENTAL',
  'MATERNITY',
] as const;

export const CLAIM_STATUSES = [
  'APPROVED',
  'REJECTED',
  'PENDING',
  'IN_REVIEW',
] as const;

export const COUNTRIES = ['Thailand', 'Vietnam', 'Hong Kong'] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type Country = (typeof COUNTRIES)[number];
export type TimeGrouping = 'week' | 'month';

export interface Claim {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: ClaimType;
  diagnosis_icd10: string;
  submitted_amount: number;
  approved_amount: number;
  status: ClaimStatus;
  submitted_date: Date;
  processed_date: Date | null;
  assessor: string;
  insurer: string;
  country: Country;
}

export interface FilterState {
  dateFrom: Date | null;
  dateTo: Date | null;
  claimTypes: ClaimType[];
  insurers: string[];
  countries: Country[];
  statuses: ClaimStatus[];
  drillDownDiagnosis: string | null;
  timeGrouping: TimeGrouping;
  tablePageIndex: number;
  tablePageSize: number;
}

export interface TableSortState {
  id: keyof Claim | string;
  desc: boolean;
}

export interface KpiMetrics {
  totalClaims: number;
  approvalRate: number | null;
  averageProcessingDays: number | null;
  totalApprovedAmount: number;
  averageClaimAmount: number;
}

/** Raw CSV row before type coercion. */
export interface ClaimCsvRow {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: string;
  diagnosis_icd10: string;
  submitted_amount: string;
  approved_amount: string;
  status: string;
  submitted_date: string;
  processed_date: string;
  assessor: string;
  insurer: string;
  country: string;
}
