"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table as ShadTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CommonPagination } from "@/components/shared/common-pagination";
import type { ColumnDef, TableProps } from "./type";

const DEFAULT_SKELETON_ROWS = 5;

const getAlignmentClass = (align?: ColumnDef<unknown>["align"]) => {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  page,
  totalPages,
  totalItems,
  onPageChange,
  itemName,
  loading = false,
  emptyMessage = "No data available.",
  skeletonRows = DEFAULT_SKELETON_ROWS,
}: TableProps<T>) {
  const empty = data.length === 0 && !loading;

  return (
    <>
      {empty ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ShadTable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(getAlignmentClass(column.align), column.headerClassName)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.map((row) => (
                  <TableRow key={keyExtractor(row)}>
                    {columns.map((column) => {
                      const cellValue = column.render
                        ? column.render(row)
                        : (row as Record<string, React.ReactNode>)[String(column.key)];

                      return (
                        <TableCell
                          key={String(column.key)}
                          className={cn(getAlignmentClass(column.align), column.className)}
                        >
                          {cellValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
          </TableBody>
        </ShadTable>
      )}

      {!loading && (
        <CommonPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          loading={loading}
          onPageChange={onPageChange}
          itemName={itemName}
        />
      )}
    </>
  );
}
