import { DashboardCharts } from '../charts/DashboardCharts';
import { GlobalFilters } from '../filters/GlobalFilters';
import { KpiCards } from '../kpi/KpiCards';
import { ClaimsTable } from '../table/ClaimsTable';
import { useFilteredClaims } from '../../hooks/useFilteredClaims';
import type { Claim } from '../../types/claim';

interface DashboardLayoutProps {
  claims: Claim[];
}

const BENTO_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md';

export function DashboardLayout({ claims }: DashboardLayoutProps) {
  const filteredClaims = useFilteredClaims(claims);

  return (
    <div className="min-h-svh bg-zinc-50">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Insurance Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Claims Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Showing {filteredClaims.length.toLocaleString('en-US')} of{' '}
            {claims.length.toLocaleString('en-US')} claims
          </p>
        </header>

        <section aria-label="Key performance indicators">
          <KpiCards claims={filteredClaims} />
        </section>

        <section aria-label="Global filters">
          <GlobalFilters allClaims={claims} />
        </section>

        <section aria-label="Charts" className={`${BENTO_CARD_CLASS} p-6`}>
          <DashboardCharts claims={filteredClaims} />
        </section>

        <section aria-label="Claims table">
          <ClaimsTable claims={filteredClaims} />
        </section>
      </main>
    </div>
  );
}
