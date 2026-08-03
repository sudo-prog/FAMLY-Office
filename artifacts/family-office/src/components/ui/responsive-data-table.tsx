// Responsive data table: desktop table + mobile stacked cards
// Usage: <ResponsiveDataTable columns={columns} data={data} onRowClick={handler} />

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  primaryKey?: string;
  mobileTitleKey?: string;
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  columns, data, onRowClick, primaryKey = 'id', mobileTitleKey,
}: ResponsiveDataTableProps<T>) {
  const titleKey = mobileTitleKey || columns[0]?.key || 'name';
  return (
    <>
      {/* Desktop: traditional table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={row[primaryKey] ?? i}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => onRowClick?.(row)}>
                {columns.map(col => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {data.map((row, i) => (
          <div key={row[primaryKey] ?? i}
            className={`rounded-xl border bg-card p-4 space-y-2 ${onRowClick ? 'cursor-pointer active:bg-muted/50' : ''}`}
            onClick={() => onRowClick?.(row)}>
            <div className="font-medium text-sm">{String(row[titleKey] ?? '')}</div>
            {columns.filter(c => !c.hideOnMobile && c.key !== titleKey).map(col => (
              <div key={col.key} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{col.header}</span>
                <span className="text-right">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
