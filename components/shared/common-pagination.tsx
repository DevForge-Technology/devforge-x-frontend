import React from "react";
import { Button } from "@/components/ui/button";

interface CommonPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function CommonPagination({
  page,
  totalPages,
  totalItems,
  loading,
  onPageChange,
  itemName = "items",
}: CommonPaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {totalItems} {itemName}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
