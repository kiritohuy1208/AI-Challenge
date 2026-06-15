import {
  Clock,
  DollarSign,
  FileStack,
  Percent,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import type { Claim } from '../../types/claim';
import {
  computeKpis,
  formatCount,
  formatCurrency,
  formatDays,
  formatPercent,
} from '../../utils/kpiCalculations';

interface KpiCardsProps {
  claims: Claim[];
}

interface KpiCardConfig {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconWrapClassName: string;
}

const KPI_CARD_CLASS =
  'rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md';

export function KpiCards({ claims }: KpiCardsProps) {
  const metrics = useMemo(() => computeKpis(claims), [claims]);

  const cards: KpiCardConfig[] = useMemo(
    () => [
      {
        label: 'Total Claims',
        value: formatCount(metrics.totalClaims),
        icon: FileStack,
        iconWrapClassName: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Approval Rate',
        value:
          metrics.approvalRate === null ? '—' : formatPercent(metrics.approvalRate),
        hint: 'Excludes PENDING claims',
        icon: Percent,
        iconWrapClassName: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Avg Processing Time',
        value:
          metrics.averageProcessingDays === null
            ? '—'
            : formatDays(metrics.averageProcessingDays),
        hint: 'Excludes claims without processed date',
        icon: Clock,
        iconWrapClassName: 'bg-amber-50 text-amber-600',
      },
      {
        label: 'Total Approved Amount',
        value: formatCurrency(metrics.totalApprovedAmount),
        icon: DollarSign,
        iconWrapClassName: 'bg-violet-50 text-violet-600',
      },
      {
        label: 'Average Claim Amount',
        value: formatCurrency(metrics.averageClaimAmount),
        icon: TrendingUp,
        iconWrapClassName: 'bg-sky-50 text-sky-600',
      },
    ],
    [metrics],
  );

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Key performance indicators"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article key={card.label} className={KPI_CARD_CLASS}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </p>
                {card.hint ? (
                  <p className="mt-1.5 text-xs text-slate-400">{card.hint}</p>
                ) : null}
              </div>
              <div
                className={`shrink-0 rounded-full p-2 ${card.iconWrapClassName}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
