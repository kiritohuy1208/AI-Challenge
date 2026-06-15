import type { Claim, KpiMetrics } from '../types/claim';

import { getProcessingDays } from './processingTime';

export function computeKpis(claims: Claim[]): KpiMetrics {
  const totalClaims = claims.length;

  const decidedClaims = claims.filter((claim) => claim.status !== 'PENDING');
  const approvedCount = claims.filter((claim) => claim.status === 'APPROVED').length;
  const approvalRate =
    decidedClaims.length > 0 ? (approvedCount / decidedClaims.length) * 100 : null;

  const processingDays = claims
    .map(getProcessingDays)
    .filter((days): days is number => days !== null);

  const averageProcessingDays =
    processingDays.length > 0
      ? processingDays.reduce((sum, days) => sum + days, 0) / processingDays.length
      : null;

  const totalApprovedAmount = claims.reduce(
    (sum, claim) => sum + claim.approved_amount,
    0,
  );

  const averageClaimAmount =
    totalClaims > 0
      ? claims.reduce((sum, claim) => sum + claim.submitted_amount, 0) / totalClaims
      : 0;

  return {
    totalClaims,
    approvalRate,
    averageProcessingDays,
    totalApprovedAmount,
    averageClaimAmount,
  };
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return compactCurrencyFormatter.format(value);
  }

  return currencyFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDays(value: number): string {
  return `${value.toFixed(1)} days`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
