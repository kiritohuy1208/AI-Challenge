import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  ClaimStatus,
  ClaimType,
  Country,
  FilterState,
  TimeGrouping,
} from '../types/claim';

const DEFAULT_TABLE_PAGE_SIZE = 25;

const defaultFilters: FilterState = {
  dateFrom: null,
  dateTo: null,
  claimTypes: [],
  insurers: [],
  countries: [],
  statuses: [],
  drillDownDiagnosis: null,
  timeGrouping: 'month',
  tablePageIndex: 0,
  tablePageSize: DEFAULT_TABLE_PAGE_SIZE,
};

interface FilterContextValue {
  filters: FilterState;
  setDateRange: (dateFrom: Date | null, dateTo: Date | null) => void;
  setClaimTypes: (claimTypes: ClaimType[]) => void;
  setInsurers: (insurers: string[]) => void;
  setCountries: (countries: Country[]) => void;
  setStatuses: (statuses: ClaimStatus[]) => void;
  setDrillDownDiagnosis: (diagnosis: string | null) => void;
  setTimeGrouping: (grouping: TimeGrouping) => void;
  setTablePageIndex: (pageIndex: number) => void;
  resetFilters: () => void;
  clearDrillDown: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setDateRange = useCallback((dateFrom: Date | null, dateTo: Date | null) => {
    setFilters((current) => ({
      ...current,
      dateFrom,
      dateTo,
      tablePageIndex: 0,
    }));
  }, []);

  const setClaimTypes = useCallback((claimTypes: ClaimType[]) => {
    setFilters((current) => ({
      ...current,
      claimTypes,
      tablePageIndex: 0,
    }));
  }, []);

  const setInsurers = useCallback((insurers: string[]) => {
    setFilters((current) => ({
      ...current,
      insurers,
      tablePageIndex: 0,
    }));
  }, []);

  const setCountries = useCallback((countries: Country[]) => {
    setFilters((current) => ({
      ...current,
      countries,
      tablePageIndex: 0,
    }));
  }, []);

  const setStatuses = useCallback((statuses: ClaimStatus[]) => {
    setFilters((current) => ({
      ...current,
      statuses,
      tablePageIndex: 0,
    }));
  }, []);

  const setDrillDownDiagnosis = useCallback((diagnosis: string | null) => {
    setFilters((current) => ({
      ...current,
      drillDownDiagnosis: diagnosis,
      tablePageIndex: 0,
    }));
  }, []);

  const setTimeGrouping = useCallback((timeGrouping: TimeGrouping) => {
    setFilters((current) => ({ ...current, timeGrouping }));
  }, []);

  const setTablePageIndex = useCallback((tablePageIndex: number) => {
    setFilters((current) => ({ ...current, tablePageIndex }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const clearDrillDown = useCallback(() => {
    setFilters((current) => ({
      ...current,
      drillDownDiagnosis: null,
      tablePageIndex: 0,
    }));
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setDateRange,
      setClaimTypes,
      setInsurers,
      setCountries,
      setStatuses,
      setDrillDownDiagnosis,
      setTimeGrouping,
      setTablePageIndex,
      resetFilters,
      clearDrillDown,
    }),
    [
      filters,
      setDateRange,
      setClaimTypes,
      setInsurers,
      setCountries,
      setStatuses,
      setDrillDownDiagnosis,
      setTimeGrouping,
      setTablePageIndex,
      resetFilters,
      clearDrillDown,
    ],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }

  return context;
}
