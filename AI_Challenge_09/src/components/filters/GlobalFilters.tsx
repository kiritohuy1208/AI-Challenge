import { parseISO } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

import { useFilters } from '../../context/FilterContext';
import {
  CLAIM_STATUSES,
  CLAIM_TYPES,
  COUNTRIES,
  type Claim,
  type ClaimStatus,
  type ClaimType,
  type Country,
} from '../../types/claim';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface GlobalFiltersProps {
  allClaims: Claim[];
}

const DATE_INPUT_CLASS =
  'filter-date-input h-10 min-w-[9.5rem] shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const SECONDARY_BTN_CLASS =
  'inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

function formatDateInput(date: Date | null): string {
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateRange(dateFrom: Date | null, dateTo: Date | null) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return { dateFrom: dateTo, dateTo: dateFrom };
  }

  return { dateFrom, dateTo };
}

function toggleValue<T extends string>(selected: T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export function GlobalFilters({ allClaims }: GlobalFiltersProps) {
  const {
    filters,
    setDateRange,
    setClaimTypes,
    setInsurers,
    setCountries,
    setStatuses,
    resetFilters,
  } = useFilters();

  const insurers = useMemo(
    () => [...new Set(allClaims.map((claim) => claim.insurer))].sort(),
    [allClaims],
  );

  const handleDateFromChange = (value: string) => {
    const dateFrom = value ? parseISO(value) : null;
    const { dateFrom: from, dateTo: to } = normalizeDateRange(dateFrom, filters.dateTo);
    setDateRange(from, to);
  };

  const handleDateToChange = (value: string) => {
    const dateTo = value ? parseISO(value) : null;
    const { dateFrom: from, dateTo: to } = normalizeDateRange(filters.dateFrom, dateTo);
    setDateRange(from, to);
  };

  const handleInsurerToggle = (insurer: string) => {
    setInsurers(toggleValue(filters.insurers, insurer));
  };

  const handleClaimTypeToggle = (claimType: ClaimType) => {
    setClaimTypes(toggleValue(filters.claimTypes, claimType));
  };

  const handleCountryToggle = (country: Country) => {
    setCountries(toggleValue(filters.countries, country));
  };

  const handleStatusToggle = (status: ClaimStatus) => {
    setStatuses(toggleValue(filters.statuses, status));
  };

  const hasActiveFilters =
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.claimTypes.length > 0 ||
    filters.insurers.length > 0 ||
    filters.countries.length > 0 ||
    filters.statuses.length > 0;

  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    filters.claimTypes.length +
    filters.insurers.length +
    filters.countries.length +
    filters.statuses.length;

  return (
    <section className="space-y-4 p-4 sm:p-5" aria-label="Global filters">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Filters</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Refine KPIs, charts, and table together
            {hasActiveFilters ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/10">
                {activeFilterCount} active
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className={SECONDARY_BTN_CLASS}
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          tabIndex={0}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-1 min-w-0 space-y-2 md:col-span-2 lg:col-span-2">
          <p className="text-xs font-medium text-slate-600">Submitted date range</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="filter-date-from">
              From
            </label>
            <input
              id="filter-date-from"
              type="date"
              className={DATE_INPUT_CLASS}
              value={formatDateInput(filters.dateFrom)}
              tabIndex={0}
              aria-label="From date"
              onChange={(event) => handleDateFromChange(event.target.value)}
            />
            <span className="text-sm text-slate-400" aria-hidden="true">
              →
            </span>
            <label className="sr-only" htmlFor="filter-date-to">
              To
            </label>
            <input
              id="filter-date-to"
              type="date"
              className={DATE_INPUT_CLASS}
              value={formatDateInput(filters.dateTo)}
              tabIndex={0}
              aria-label="To date"
              onChange={(event) => handleDateToChange(event.target.value)}
            />
          </div>
        </div>

        <div className="col-span-1 min-w-0 md:col-span-1 lg:col-span-1">
          <MultiSelectDropdown
            label="Claim type"
            placeholder="All claim types"
            options={CLAIM_TYPES}
            selected={filters.claimTypes}
            onToggle={handleClaimTypeToggle}
            onClear={() => setClaimTypes([])}
          />
        </div>

        <div className="col-span-1 min-w-0 md:col-span-1 lg:col-span-1">
          <MultiSelectDropdown
            label="Insurer"
            placeholder="All insurers"
            options={insurers}
            selected={filters.insurers}
            onToggle={handleInsurerToggle}
            onClear={() => setInsurers([])}
          />
        </div>

        <div className="col-span-1 min-w-0 md:col-span-1 lg:col-span-1">
          <MultiSelectDropdown
            label="Country"
            placeholder="All countries"
            options={COUNTRIES}
            selected={filters.countries}
            onToggle={handleCountryToggle}
            onClear={() => setCountries([])}
          />
        </div>

        <div className="col-span-1 min-w-0 md:col-span-1 lg:col-span-1">
          <MultiSelectDropdown
            label="Status"
            placeholder="All statuses"
            options={CLAIM_STATUSES}
            selected={filters.statuses}
            onToggle={handleStatusToggle}
            onClear={() => setStatuses([])}
          />
        </div>
      </div>
    </section>
  );
}
