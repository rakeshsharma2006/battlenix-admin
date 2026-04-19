// components/DataTable.tsx
'use client';

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

import { ADMIN_COLORS } from '@/lib/admin-utils';

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
};

type RowWithId = {
  _id?: string;
};

export default function DataTable<T extends RowWithId>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records available.',
}: DataTableProps<T>) {
  const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        border: `1px solid ${ADMIN_COLORS.border}`,
        borderRadius: 16,
        background: ADMIN_COLORS.bgCard,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: ADMIN_COLORS.bgSurface }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '14px 16px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: ADMIN_COLORS.textSecondary,
                  textAlign: 'left',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading
            ? skeletonRows.map((rowIndex) => (
              <tr
                key={`skeleton-${rowIndex}`}
                style={{
                  background: ADMIN_COLORS.bgCard,
                  borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                }}
              >
                {columns.map((column, columnIndex) => (
                  <td key={`${column.key}-${columnIndex}`} style={{ padding: '14px 16px' }}>
                    <div
                      className="animate-pulse"
                      style={{
                        width: `${Math.max(35, 70 - columnIndex * 6)}%`,
                        height: 12,
                        borderRadius: 6,
                        background: ADMIN_COLORS.bgElevated,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
            : null}

          {!loading && data.length
            ? data.map((row, index) => (
              <tr
                key={row._id ?? `${columns[0]?.key ?? 'row'}-${index}`}
                className="transition table-row"
                style={{
                  background: ADMIN_COLORS.bgCard,
                  borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                }}
              >
                {columns.map((column) => (
                  <td
                    key={`${column.key}-${row._id ?? index}`}
                    className="table-cell"
                    style={{
                      padding: '14px 16px',
                      color: ADMIN_COLORS.textPrimary,
                      fontSize: 14,
                      verticalAlign: 'middle',
                    }}
                  >
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
            : null}
        </tbody>
      </table>

      {!loading && !data.length ? (
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              className="flex"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                background: ADMIN_COLORS.bgElevated,
                border: `1px solid ${ADMIN_COLORS.border}`,
              }}
            >
              <Inbox size={18} color={ADMIN_COLORS.textSecondary} />
            </div>
            <p style={{ margin: 0, color: ADMIN_COLORS.textSecondary, fontSize: 14 }}>{emptyMessage}</p>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .table-row:hover {
          background: #1a1a28 !important;
        }

        .table-cell {
          min-width: 120px;
        }
      `}</style>
    </div>
  );
}
