"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  currentItemsCount?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  currentItemsCount,
  itemLabel = "data",
  onPageChange,
  isLoading = false,
  className = "",
}) => {
  const [inputVal, setInputVal] = useState<string>(String(currentPage));
  const [prevCurrentPage, setPrevCurrentPage] = useState(currentPage);

  // Sync input value whenever currentPage prop changes (React recommended pattern)
  if (prevCurrentPage !== currentPage) {
    setPrevCurrentPage(currentPage);
    setInputVal(String(currentPage));
  }

  const safeTotalPages = Math.max(totalPages, 1);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= safeTotalPages;

  const handleApplyPage = () => {
    const parsed = parseInt(inputVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      onPageChange(1);
      setInputVal("1");
    } else if (parsed > safeTotalPages) {
      onPageChange(safeTotalPages);
      setInputVal(String(safeTotalPages));
    } else {
      onPageChange(parsed);
      setInputVal(String(parsed));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyPage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, "");
    setInputVal(val);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3.5 px-5 py-4 border-t border-gray-border bg-gray-sidebar-hover/20 ${className}`}
    >
      {/* Total Data Info */}
      <div className="text-xs text-gray-secondary-text font-medium text-center sm:text-left order-2 sm:order-1">
        {totalItems !== undefined && (
          <>
            Menampilkan{" "}
            <span className="font-semibold text-gray-heading-main">
              {currentItemsCount !== undefined ? currentItemsCount : totalItems}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-heading-main">
              {totalItems}
            </span>{" "}
            {itemLabel}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* First Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={isFirstPage || isLoading}
          title="Halaman Pertama"
          className="p-1.5 sm:p-2 min-w-8 h-8 sm:min-w-9 sm:h-9 flex items-center justify-center border border-gray-border rounded-xl bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={isFirstPage || isLoading}
          title="Halaman Sebelumnya"
          className="p-1.5 sm:p-2 min-w-8 h-8 sm:min-w-9 sm:h-9 flex items-center justify-center border border-gray-border rounded-xl bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Jump / Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-secondary-text font-medium">
          <span>Halaman</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleApplyPage}
            onKeyDown={handleKeyDown}
            disabled={isLoading || safeTotalPages <= 1}
            title={`Masukkan nomor halaman (1 - ${safeTotalPages})`}
            className="w-11 sm:w-12 h-8 sm:h-9 text-center text-xs font-bold rounded-xl border border-gray-border bg-gray-card text-gray-heading-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
          />
          <span>
            dari{" "}
            <span className="font-semibold text-gray-heading-main">
              {safeTotalPages}
            </span>
          </span>
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, safeTotalPages))}
          disabled={isLastPage || isLoading}
          title="Halaman Selanjutnya"
          className="p-1.5 sm:p-2 min-w-8 h-8 sm:min-w-9 sm:h-9 flex items-center justify-center border border-gray-border rounded-xl bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={isLastPage || isLoading}
          title="Halaman Terakhir"
          className="p-1.5 sm:p-2 min-w-8 h-8 sm:min-w-9 sm:h-9 flex items-center justify-center border border-gray-border rounded-xl bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
