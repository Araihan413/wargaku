import React from "react";

interface TableSkeletonProps {
  /**
   * Jumlah baris skeleton yang ditampilkan (default: 5)
   */
  rowCount?: number;
  /**
   * Jumlah kolom (colSpan) per baris (default: 6)
   */
  colCount?: number;
  /**
   * Apakah kolom terakhir berupa tombol aksi (default: true)
   */
  showActionButtons?: boolean;
  /**
   * Padding horizontal pada setiap cell tabel (default: "px-5 py-4")
   */
  cellPadding?: string;
}

const WIDTH_PATTERNS = [
  ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-4/5"],
  ["w-2/3", "w-3/5", "w-1/2", "w-2/5", "w-3/4"],
  ["w-4/5", "w-2/3", "w-3/5", "w-1/2", "w-1/3"],
  ["w-1/2", "w-3/4", "w-2/5", "w-3/5", "w-2/3"],
  ["w-3/5", "w-1/2", "w-4/5", "w-1/3", "w-3/5"],
];

/**
 * Komponen Skeleton Baris Tabel terpadu.
 * Digunakan langsung di dalam <tbody> untuk menggantikan spinner tabel saat loading data.
 */
export function TableSkeleton({
  rowCount = 5,
  colCount = 6,
  showActionButtons = true,
  cellPadding = "px-5 py-4",
}: TableSkeletonProps) {
  const rows = Array.from({ length: rowCount });

  return (
    <>
      {rows.map((_, rowIndex) => {
        const pattern = WIDTH_PATTERNS[rowIndex % WIDTH_PATTERNS.length];
        const contentColsCount = showActionButtons ? Math.max(1, colCount - 1) : colCount;

        return (
          <tr
            key={`table-skeleton-row-${rowIndex}`}
            className="animate-pulse transition-colors"
          >
            {Array.from({ length: contentColsCount }).map((__, colIndex) => {
              const widthClass = pattern[colIndex % pattern.length];

              // Kolom pertama seringkali nomor / avatar kecil
              if (colIndex === 0 && contentColsCount > 3) {
                return (
                  <td key={`cell-${rowIndex}-${colIndex}`} className={cellPadding}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gray-border/70 shrink-0" />
                      <div className={`h-4 ${widthClass} bg-gray-border/60 rounded-md`} />
                    </div>
                  </td>
                );
              }

              return (
                <td key={`cell-${rowIndex}-${colIndex}`} className={cellPadding}>
                  <div className={`h-4 ${widthClass} bg-gray-border/60 rounded-md`} />
                </td>
              );
            })}

            {/* Kolom Aksi (Paling Kanan) */}
            {showActionButtons && (
              <td key={`action-${rowIndex}`} className={`${cellPadding} text-right`}>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-8 w-8 rounded-xl bg-gray-border/70 shrink-0" />
                  <div className="h-8 w-8 rounded-xl bg-gray-border/70 shrink-0" />
                </div>
              </td>
            )}
          </tr>
        );
      })}
    </>
  );
}

/**
 * Komponen Standalone Skeleton Tabel lengkap dengan Container & Header Placeholder.
 * Digunakan jika tabel belum memiliki struktur <table> parent.
 */
export function StandaloneTableSkeleton({
  rowCount = 5,
  colCount = 6,
  className = "",
}: {
  rowCount?: number;
  colCount?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-border bg-gray-card shadow-xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover/60">
              {Array.from({ length: colCount }).map((_, idx) => (
                <th key={`th-${idx}`} className="px-5 py-4">
                  <div className="h-3.5 w-20 bg-gray-border/80 rounded-md animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border">
            <TableSkeleton rowCount={rowCount} colCount={colCount} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
