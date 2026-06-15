import Papa from 'papaparse';
import { useEffect, useState } from 'react';

import type { Claim, ClaimCsvRow } from '../types/claim';
import { parseClaimRow } from '../utils/parseClaimRow';

interface UseClaimsDataResult {
  claims: Claim[];
  isLoading: boolean;
  error: string | null;
}

export function useClaimsData(): UseClaimsDataResult {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClaims(): Promise<void> {
      try {
        const csvPath = import.meta.env.VITE_CLAIMS_CSV ?? '/claims.csv';
        const response = await fetch(csvPath);

        if (!response.ok) {
          throw new Error(`Failed to load ${csvPath} (${response.status})`);
        }

        const csvText = await response.text();

        Papa.parse<ClaimCsvRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (cancelled) {
              return;
            }

            if (results.errors.length > 0) {
              setError(results.errors[0]?.message ?? 'CSV parse error');
              setIsLoading(false);
              return;
            }

            try {
              const parsedClaims = results.data.map(parseClaimRow);
              setClaims(parsedClaims);
              setError(null);
            } catch (parseError) {
              setError(
                parseError instanceof Error ? parseError.message : 'Invalid claim data',
              );
            }

            setIsLoading(false);
          },
          error: (parseError: Error) => {
            if (!cancelled) {
              setError(parseError.message);
              setIsLoading(false);
            }
          },
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load data');
          setIsLoading(false);
        }
      }
    }

    void loadClaims();

    return () => {
      cancelled = true;
    };
  }, []);

  return { claims, isLoading, error };
}
