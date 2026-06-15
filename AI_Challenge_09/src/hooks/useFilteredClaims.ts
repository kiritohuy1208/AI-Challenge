import { useMemo } from 'react';

import { useFilters } from '../context/FilterContext';
import type { Claim } from '../types/claim';
import { filterClaims } from '../utils/filterClaims';

export function useFilteredClaims(claims: Claim[]): Claim[] {
  const { filters } = useFilters();

  return useMemo(
    () => filterClaims(claims, filters),
    [
      claims,
      filters.dateFrom,
      filters.dateTo,
      filters.claimTypes,
      filters.insurers,
      filters.countries,
      filters.statuses,
      filters.drillDownDiagnosis,
    ],
  );
}
