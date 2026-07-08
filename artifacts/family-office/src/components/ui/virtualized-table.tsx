import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface VirtualizedTableProps<T> {
  data: T[];
  /** Estimated row height in pixels. Default 48. */
  rowHeight?: number;
  /** Number of rows to render above/below visible area. Default 8. */
  overscan?: number;
  /** Max height of scrollable area (default 640px). */
  maxHeight?: number;
  className?: string;
  /** Stable key for each row. */
  getRowKey: (item: T, index: number) => React.Key;
  /** Render the <thead>. Usually a <thead> with a <tr> of <th> elements. */
  header: React.ReactElement;
  /** Render a single row's <td> children. Must include the className and any onClick handlers. */
  renderCells: (item: T, index: number) => React.ReactNode;
  /** Number of columns (for empty state colSpan). */
  colCount: number;
  /** Content to show when data is empty. */
  emptyState?: React.ReactNode;
  /** Additional className for rows (e.g., "border-border hover:bg-muted/30"). */
  rowClassName?: string;
}

/**
 * Virtualized table using @tanstack/react-virtual.
 *
 * Only renders visible rows + an overscan buffer for smooth scrolling with
 * large datasets (50+ rows). Keeps column widths consistent between the
 * sticky header and the virtualized body.
 *
 * Example:
 * ```tsx
 * <VirtualizedTable
 *   data={transactions}
 *   getRowKey={(tx) => tx.id}
 *   colCount={7}
 *   header={
 *     <TableHeader className="bg-muted/50">
 *       <TableRow>
 *         <TableHead>Description</TableHead>
 *         ...
 *       </TableRow>
 *     </TableHeader>
 *   }
 *   renderCells={(tx) => (
 *     <>
 *       <TableCell>{tx.description}</TableCell>
 *       ...
 *     </>
 *   )}
 *   emptyState="No transactions yet."
 * />
 * ```
 */
export function VirtualizedTable<T>({
  data,
  rowHeight = 48,
  overscan = 8,
  maxHeight = 640,
  className,
  getRowKey,
  header,
  renderCells,
  colCount,
  emptyState,
  rowClassName,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className={className}>
      {data.length === 0 ? (
        <table className="w-full text-sm">
          {header}
          <tbody>
            <tr>
              <td colSpan={colCount} className="h-28 text-center text-muted-foreground text-sm">
                {emptyState ?? "No data."}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <table className="w-full text-sm">
            {React.cloneElement(header as React.ReactElement<{ className?: string }>, {
              className: cn(
                (header.props as { className?: string }).className ?? "",
                "sticky top-0 z-10 bg-background"
              ),
            })}
            <tbody
              style={{
                height: rowVirtualizer.getTotalSize(),
                position: "relative",
                display: "block",
              }}
            >
              {virtualRows.map((virtualRow) => {
                const item = data[virtualRow.index];
                return (
                  <tr
                    key={getRowKey(item, virtualRow.index)}
                    className={rowClassName}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderCells(item, virtualRow.index)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
