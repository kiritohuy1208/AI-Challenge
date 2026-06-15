import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useFilters } from '../../context/FilterContext';
import type { Claim, ClaimStatus } from '../../types/claim';
import { exportClaimsToCsv } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/kpiCalculations';

interface ClaimsTableProps {
  claims: Claim[];
}

const columnHelper = createColumnHelper<Claim>();

const SECONDARY_BTN_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

const STATUS_BADGE_CLASS: Record<ClaimStatus, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  IN_REVIEW: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASS[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUp size={14} aria-hidden="true" className="text-slate-400" />;
  }

  if (direction === 'desc') {
    return <ArrowDown size={14} aria-hidden="true" className="text-slate-400" />;
  }

  return <ArrowUpDown size={14} aria-hidden="true" className="text-slate-300" />;
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  const { filters, setTablePageIndex, clearDrillDown } = useFilters();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('claim_id', {
        header: 'Claim ID',
        cell: (info) => (
          <span className="font-medium text-slate-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('member_name', {
        header: 'Member',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('claim_type', {
        header: 'Type',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('diagnosis_icd10', {
        header: 'Diagnosis',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-700">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('submitted_amount', {
        header: 'Submitted',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('approved_amount', {
        header: 'Approved',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('submitted_date', {
        header: 'Submitted Date',
        cell: (info) => format(info.getValue(), 'yyyy-MM-dd'),
        sortingFn: (rowA, rowB) =>
          rowA.original.submitted_date.getTime() - rowB.original.submitted_date.getTime(),
      }),
      columnHelper.accessor('processed_date', {
        header: 'Processed Date',
        cell: (info) => {
          const value = info.getValue();
          return value ? format(value, 'yyyy-MM-dd') : '—';
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.processed_date?.getTime() ?? -1;
          const b = rowB.original.processed_date?.getTime() ?? -1;
          return a - b;
        },
      }),
      columnHelper.accessor('insurer', {
        header: 'Insurer',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('country', {
        header: 'Country',
        cell: (info) => info.getValue(),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: claims,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: filters.tablePageIndex,
        pageSize: filters.tablePageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: filters.tablePageIndex,
        pageSize: filters.tablePageSize,
      };
      const next = typeof updater === 'function' ? updater(current) : updater;
      setTablePageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  useEffect(() => {
    if (claims.length === 0) {
      if (filters.tablePageIndex !== 0) {
        setTablePageIndex(0);
      }
      return;
    }

    const maxPageIndex = Math.ceil(claims.length / filters.tablePageSize) - 1;

    if (filters.tablePageIndex > maxPageIndex) {
      setTablePageIndex(maxPageIndex);
    }
  }, [claims.length, filters.tablePageIndex, filters.tablePageSize, setTablePageIndex]);

  const pageCount = table.getPageCount();
  const currentPage = filters.tablePageIndex + 1;

  return (
    <section aria-label="Claims data table">
      {filters.drillDownDiagnosis ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-slate-800">
          <span>
            Showing claims for diagnosis:{' '}
            <strong className="font-semibold text-slate-900">
              {filters.drillDownDiagnosis}
            </strong>
          </span>
          <button
            type="button"
            className={SECONDARY_BTN_CLASS}
            onClick={clearDrillDown}
          >
            Clear drill-down
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Claims Detail
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {claims.length.toLocaleString('en-US')} filtered claim
            {claims.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          className={SECONDARY_BTN_CLASS}
          onClick={() => exportClaimsToCsv(claims)}
          aria-label="Export filtered claims to CSV"
        >
          <Download size={16} aria-hidden="true" />
          Export to CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-sm">
            <thead className="bg-slate-50/80 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="border-b border-slate-200 px-4 py-3 text-left"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                            header.column.getCanSort()
                              ? 'cursor-pointer hover:text-slate-700'
                              : 'cursor-default'
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? (
                            <SortIcon direction={header.column.getIsSorted()} />
                          ) : null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No claims match the current filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3 text-slate-700"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Page {pageCount === 0 ? 0 : currentPage} of {pageCount}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={SECONDARY_BTN_CLASS}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className={SECONDARY_BTN_CLASS}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
