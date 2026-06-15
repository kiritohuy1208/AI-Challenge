import { differenceInCalendarDays } from 'date-fns';

import type { Claim } from '../types/claim';

export function getProcessingDays(claim: Claim): number | null {
  if (claim.processed_date === null) {
    return null;
  }

  return differenceInCalendarDays(claim.processed_date, claim.submitted_date);
}

export function getClaimsWithProcessingTime(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.processed_date !== null);
}
