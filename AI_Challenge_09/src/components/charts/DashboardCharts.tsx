import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useFilters } from '../../context/FilterContext';
import type { Claim, ClaimStatus } from '../../types/claim';
import {
  aggregateApprovalRateByInsurer,
  aggregateByStatus,
  aggregateClaimsOverTime,
  aggregateProcessingTimeHistogram,
  aggregateTopDiagnosesByCount,
  aggregateTopDiagnosesByCost,
  type DiagnosisCountDatum,
  type InsurerApprovalDatum,
  type StatusChartDatum,
} from '../../utils/chartAggregations';
import { formatCount, formatCurrency, formatPercent } from '../../utils/kpiCalculations';

interface DashboardChartsProps {
  claims: Claim[];
}

/** Tailwind-inspired chart palette (visual only — not used in aggregation). */
const CHART_PALETTE = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#fb7185',
  amber: '#f59e0b',
  slate: '#94a3b8',
} as const;

const STATUS_SLICE_COLORS: Record<ClaimStatus, string> = {
  APPROVED: CHART_PALETTE.emerald,
  REJECTED: CHART_PALETTE.rose,
  PENDING: CHART_PALETTE.amber,
  IN_REVIEW: CHART_PALETTE.indigo,
};

const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
  vertical: false,
} as const;

const AXIS_TICK = { fontSize: 11, fill: '#64748b' };

const AXIS_LINE_PROPS = {
  axisLine: false,
  tickLine: false,
} as const;

const CHART_PANEL_CLASS =
  'min-w-0 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

function ChartPanel({ title, subtitle, children, action }: ChartPanelProps) {
  return (
    <article className={CHART_PANEL_CLASS}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-h-[280px]">{children}</div>
    </article>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="flex min-h-[240px] items-center justify-center text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

function ChartTooltipShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-3 text-sm shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="mt-1 space-y-0.5 text-slate-600">{children}</div>
    </div>
  );
}

function StatusTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StatusChartDatum }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.status}>
      <p>{formatCount(data.count)} claims</p>
      <p>{formatPercent(data.percentage)} of total</p>
    </ChartTooltipShell>
  );
}

function TimeSeriesTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { period: string; count: number } }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.period}>
      <p>{formatCount(data.count)} claims</p>
    </ChartTooltipShell>
  );
}

function DiagnosisCountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DiagnosisCountDatum }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.diagnosis}>
      <p>{formatCount(data.count)} claims</p>
    </ChartTooltipShell>
  );
}

function DiagnosisCostTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { diagnosis: string; totalCost: number } }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.diagnosis}>
      <p>{formatCurrency(data.totalCost)} total cost</p>
    </ChartTooltipShell>
  );
}

function HistogramTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { bucket: string; count: number } }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.bucket}>
      <p>{formatCount(data.count)} claims</p>
    </ChartTooltipShell>
  );
}

function InsurerApprovalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: InsurerApprovalDatum }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <ChartTooltipShell title={data.insurer}>
      <p>{formatPercent(data.approvalRate)} approval rate</p>
      <p>
        {formatCount(data.approved)} approved / {formatCount(data.decided)} decided
      </p>
    </ChartTooltipShell>
  );
}

export function DashboardCharts({ claims }: DashboardChartsProps) {
  const {
    filters,
    setDrillDownDiagnosis,
    setTimeGrouping,
    clearDrillDown,
  } = useFilters();

  const statusData = useMemo(() => aggregateByStatus(claims), [claims]);
  const timeSeriesData = useMemo(
    () => aggregateClaimsOverTime(claims, filters.timeGrouping),
    [claims, filters.timeGrouping],
  );
  const topDiagnosesByCount = useMemo(
    () => aggregateTopDiagnosesByCount(claims),
    [claims],
  );
  const topDiagnosesByCost = useMemo(
    () => aggregateTopDiagnosesByCost(claims),
    [claims],
  );
  const processingHistogram = useMemo(
    () => aggregateProcessingTimeHistogram(claims),
    [claims],
  );
  const approvalByInsurer = useMemo(
    () => aggregateApprovalRateByInsurer(claims),
    [claims],
  );

  useEffect(() => {
    if (filters.drillDownDiagnosis === null) {
      return;
    }

    const diagnosisStillVisible = claims.some(
      (claim) => claim.diagnosis_icd10 === filters.drillDownDiagnosis,
    );

    if (!diagnosisStillVisible) {
      clearDrillDown();
    }
  }, [claims, filters.drillDownDiagnosis, clearDrillDown]);

  const handleDiagnosisClick = (datum: DiagnosisCountDatum) => {
    setDrillDownDiagnosis(
      filters.drillDownDiagnosis === datum.diagnosis ? null : datum.diagnosis,
    );
  };

  return (
    <section aria-label="Claims analytics charts">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartPanel title="Claims by Status" subtitle="Distribution of filtered claims">
          {statusData.length === 0 ? (
            <ChartEmptyState message="No claims match the current filters." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={({ status, percentage }) =>
                    `${status} (${percentage.toFixed(1)}%)`
                  }
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_SLICE_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip content={<StatusTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#64748b' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel
          title="Claims Over Time"
          subtitle="Submitted claims grouped by period"
          action={
            <div
              className="inline-flex overflow-hidden rounded-lg border border-slate-200/80"
              role="group"
              aria-label="Time grouping"
            >
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.timeGrouping === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setTimeGrouping('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={`border-l border-slate-200/80 px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.timeGrouping === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setTimeGrouping('month')}
              >
                Month
              </button>
            </div>
          }
        >
          {timeSeriesData.length === 0 ? (
            <ChartEmptyState message="No claims in the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeSeriesData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  dataKey="period"
                  tick={AXIS_TICK}
                  interval="preserveStartEnd"
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  {...AXIS_LINE_PROPS}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK} {...AXIS_LINE_PROPS} />
                <Tooltip content={<TimeSeriesTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Claims"
                  stroke={CHART_PALETTE.blue}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_PALETTE.blue, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: CHART_PALETTE.indigo, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel
          title="Top 10 Diagnoses by Frequency"
          subtitle="Click a bar to drill down"
        >
          {topDiagnosesByCount.length === 0 ? (
            <ChartEmptyState message="No diagnosis data available." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topDiagnosesByCount}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={AXIS_TICK}
                  {...AXIS_LINE_PROPS}
                />
                <YAxis
                  type="category"
                  dataKey="diagnosis"
                  width={72}
                  tick={AXIS_TICK}
                  {...AXIS_LINE_PROPS}
                />
                <Tooltip content={<DiagnosisCountTooltip />} />
                <Bar
                  dataKey="count"
                  name="Claims"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(barData) => {
                    const payload = (barData as { payload?: DiagnosisCountDatum }).payload;
                    if (payload) {
                      handleDiagnosisClick(payload);
                    }
                  }}
                >
                  {topDiagnosesByCount.map((entry) => (
                    <Cell
                      key={entry.diagnosis}
                      fill={
                        entry.diagnosis === filters.drillDownDiagnosis
                          ? CHART_PALETTE.indigo
                          : CHART_PALETTE.slate
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Top 10 Diagnoses by Total Cost" subtitle="Sum of submitted amounts">
          {topDiagnosesByCost.length === 0 ? (
            <ChartEmptyState message="No cost data available." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topDiagnosesByCost}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  type="number"
                  tick={AXIS_TICK}
                  tickFormatter={(value: number) => formatCurrency(value)}
                  {...AXIS_LINE_PROPS}
                />
                <YAxis
                  type="category"
                  dataKey="diagnosis"
                  width={72}
                  tick={AXIS_TICK}
                  {...AXIS_LINE_PROPS}
                />
                <Tooltip content={<DiagnosisCostTooltip />} />
                <Bar
                  dataKey="totalCost"
                  name="Total cost"
                  fill={CHART_PALETTE.emerald}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel
          title="Processing Time Distribution"
          subtitle="Excludes claims without a processed date"
        >
          {processingHistogram.every((bucket) => bucket.count === 0) ? (
            <ChartEmptyState message="No processed claims to chart." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={processingHistogram} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="bucket" tick={AXIS_TICK} {...AXIS_LINE_PROPS} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} {...AXIS_LINE_PROPS} />
                <Tooltip content={<HistogramTooltip />} />
                <Bar
                  dataKey="count"
                  name="Claims"
                  fill={CHART_PALETTE.indigo}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel
          title="Approval Rate by Insurer"
          subtitle="Approved / decided claims (excludes PENDING)"
        >
          {approvalByInsurer.length === 0 ? (
            <ChartEmptyState message="No decided claims by insurer." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={approvalByInsurer} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  dataKey="insurer"
                  tick={AXIS_TICK}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={70}
                  {...AXIS_LINE_PROPS}
                />
                <YAxis
                  tick={AXIS_TICK}
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  {...AXIS_LINE_PROPS}
                />
                <Tooltip content={<InsurerApprovalTooltip />} />
                <Bar
                  dataKey="approvalRate"
                  name="Approval rate"
                  fill={CHART_PALETTE.blue}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>
    </section>
  );
}
