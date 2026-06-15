export function LoadingSkeleton() {
  return (
    <div className="min-h-svh bg-zinc-50" aria-busy="true" aria-live="polite">
      <main className="dashboard-layout dashboard-loading mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="skeleton-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>

        <div className="skeleton-kpi-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-card rounded-2xl border border-slate-200/60 bg-white">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-value" />
            </div>
          ))}
        </div>

        <div className="skeleton-panel rounded-2xl border border-slate-200/60 bg-white">
          <div className="skeleton skeleton-panel-title" />
          <div className="skeleton-filters-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton skeleton-filter-block" />
            ))}
          </div>
        </div>

        <div className="skeleton-charts-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="skeleton-panel rounded-2xl border border-slate-200/60 bg-white"
            >
              <div className="skeleton skeleton-panel-title" />
              <div className="skeleton skeleton-chart" />
            </div>
          ))}
        </div>

        <div className="skeleton-panel rounded-2xl border border-slate-200/60 bg-white">
          <div className="skeleton skeleton-panel-title" />
          <div className="skeleton skeleton-table" />
        </div>

        <p className="loading-message text-center text-sm font-medium text-slate-500" role="status">
          Loading claims data…
        </p>
      </main>
    </div>
  );
}
