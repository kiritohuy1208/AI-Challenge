import { format, getISOWeek, getISOWeekYear, startOfMonth } from 'date-fns';

import { CLAIM_STATUSES, type Claim, type ClaimStatus, type TimeGrouping } from '../types/claim';

import { getProcessingDays } from './processingTime';

export interface StatusChartDatum {
  status: ClaimStatus;
  count: number;
  percentage: number;
}

export interface TimeSeriesDatum {
  period: string;
  sortKey: string;
  count: number;
}

export interface DiagnosisCountDatum {
  diagnosis: string;
  count: number;
}

export interface DiagnosisCostDatum {
  diagnosis: string;
  totalCost: number;
}

export interface HistogramDatum {
  bucket: string;
  count: number;
}

export interface InsurerApprovalDatum {
  insurer: string;
  approvalRate: number;
  approved: number;
  decided: number;
}

const PROCESSING_BUCKETS = [
  { label: '0–3 days', min: 0, max: 3 },
  { label: '4–7 days', min: 4, max: 7 },
  { label: '8–14 days', min: 8, max: 14 },
  { label: '15–30 days', min: 15, max: 30 },
] as const;

export function aggregateByStatus(claims: Claim[]): StatusChartDatum[] {
  const total = claims.length;

  return CLAIM_STATUSES.map((status) => {
    const count = claims.filter((claim) => claim.status === status).length;
    return {
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  }).filter((datum) => datum.count > 0);
}

export function aggregateClaimsOverTime(
  claims: Claim[],
  grouping: TimeGrouping,
): TimeSeriesDatum[] {
  const map = new Map<string, TimeSeriesDatum>();

  for (const claim of claims) {
    let period: string;
    let sortKey: string;

    if (grouping === 'week') {
      const year = getISOWeekYear(claim.submitted_date);
      const week = getISOWeek(claim.submitted_date);
      sortKey = `${year}-W${String(week).padStart(2, '0')}`;
      period = `W${week} ${year}`;
    } else {
      const monthStart = startOfMonth(claim.submitted_date);
      sortKey = format(monthStart, 'yyyy-MM');
      period = format(monthStart, 'MMM yyyy');
    }

    const existing = map.get(sortKey);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(sortKey, { period, sortKey, count: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function aggregateTopDiagnosesByCount(
  claims: Claim[],
  limit = 10,
): DiagnosisCountDatum[] {
  const counts = new Map<string, number>();

  for (const claim of claims) {
    counts.set(claim.diagnosis_icd10, (counts.get(claim.diagnosis_icd10) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function aggregateTopDiagnosesByCost(
  claims: Claim[],
  limit = 10,
): DiagnosisCostDatum[] {
  const totals = new Map<string, number>();

  for (const claim of claims) {
    totals.set(
      claim.diagnosis_icd10,
      (totals.get(claim.diagnosis_icd10) ?? 0) + claim.submitted_amount,
    );
  }

  return Array.from(totals.entries())
    .map(([diagnosis, totalCost]) => ({ diagnosis, totalCost }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit);
}

export function aggregateProcessingTimeHistogram(claims: Claim[]): HistogramDatum[] {
  const counts = PROCESSING_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    count: 0,
  }));

  for (const claim of claims) {
    const days = getProcessingDays(claim);
    if (days === null) {
      continue;
    }

    const bucketIndex = PROCESSING_BUCKETS.findIndex(
      (bucket) => days >= bucket.min && days <= bucket.max,
    );

    if (bucketIndex >= 0) {
      counts[bucketIndex].count += 1;
    }
  }

  return counts;
}

export function aggregateApprovalRateByInsurer(claims: Claim[]): InsurerApprovalDatum[] {
  const map = new Map<string, { approved: number; decided: number }>();

  for (const claim of claims) {
    if (claim.status === 'PENDING') {
      continue;
    }

    const entry = map.get(claim.insurer) ?? { approved: 0, decided: 0 };
    entry.decided += 1;

    if (claim.status === 'APPROVED') {
      entry.approved += 1;
    }

    map.set(claim.insurer, entry);
  }

  return Array.from(map.entries())
    .map(([insurer, { approved, decided }]) => ({
      insurer,
      approved,
      decided,
      approvalRate: decided > 0 ? (approved / decided) * 100 : 0,
    }))
    .sort((a, b) => a.insurer.localeCompare(b.insurer));
}

export const STATUS_CHART_COLORS: Record<ClaimStatus, string> = {
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  PENDING: '#d97706',
  IN_REVIEW: '#2563eb',
};
