import { endOfDay, isWithinInterval, startOfDay } from 'date-fns';

import type { Claim, FilterState } from '../types/claim';

function matchesDateRange(claim: Claim, dateFrom: Date | null, dateTo: Date | null): boolean {
  if (dateFrom === null && dateTo === null) {
    return true;
  }

  const submitted = claim.submitted_date;
  const from = dateFrom ? startOfDay(dateFrom) : new Date(0);
  const to = dateTo ? endOfDay(dateTo) : new Date(8640000000000000);

  return isWithinInterval(submitted, { start: from, end: to });
}

function matchesMultiSelect<T extends string>(
  value: T,
  selected: readonly T[],
): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function filterClaims(claims: Claim[], filters: FilterState): Claim[] {
  return claims.filter((claim) => {
    if (!matchesDateRange(claim, filters.dateFrom, filters.dateTo)) {
      return false;
    }

    if (!matchesMultiSelect(claim.claim_type, filters.claimTypes)) {
      return false;
    }

    if (!matchesMultiSelect(claim.insurer, filters.insurers)) {
      return false;
    }

    if (!matchesMultiSelect(claim.country, filters.countries)) {
      return false;
    }

    if (!matchesMultiSelect(claim.status, filters.statuses)) {
      return false;
    }

    if (
      filters.drillDownDiagnosis !== null &&
      claim.diagnosis_icd10 !== filters.drillDownDiagnosis
    ) {
      return false;
    }

    return true;
  });
}
