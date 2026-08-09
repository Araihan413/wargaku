import React from "react";
import { Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { AnnouncementReportItem, ReportPagination } from "../types";

interface AnnouncementsTableProps {
  data: AnnouncementReportItem[];
  pagination: ReportPagination;
  onPageChange: (page: number) => void;
}

const categoryConfig: Record<string, { label: string; className: string }> = {
  umum: { label: "Umum", className: "bg-blue-100 text-blue-800 border-blue-200" },
  penting: { label: "Penting", className: "bg-amber-100 text-amber-800 border-amber-200" },
  mendesak: { label: "Mendesak", className: "bg-red-100 text-red-800 border-red-200" },
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const AnnouncementsTable: React.FC<AnnouncementsTableProps> = ({
  data,
  pagination,
  onPageChange,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover/40 text-gray-secondary-text font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">Judul Pengumuman</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4 text-center">Pin</th>
              <th className="py-3.5 px-4">Dibuat Oleh</th>
              <th className="py-3.5 px-4">Tanggal Terbit</th>
              <th className="py-3.5 px-4">Isi Singkat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-secondary-text font-medium">
                  Tidak ada pengumuman yang ditemukan.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const cat = categoryConfig[item.category] || {
                  label: item.category,
                  className: "bg-gray-100 text-gray-700 border-gray-200",
                };
                return (
                  <tr key={item.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-heading-main max-w-xs">
                      <div className="truncate">{item.title}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${cat.className}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.isPinned ? (
                        <span className="inline-flex items-center justify-center">
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-heading-main whitespace-nowrap font-semibold">
                      {item.creatorName || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-secondary-text whitespace-nowrap">
                      {formatDate(item.publishedAt || item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-secondary-text max-w-xs truncate">
                      {item.content}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-gray-secondary-text font-medium">
            Menampilkan{" "}
            <strong>{(pagination.currentPage - 1) * pagination.limit + 1}</strong>
            {" - "}
            <strong>{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</strong>
            {" dari "}<strong>{pagination.totalItems}</strong> pengumuman
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-gray-heading-main transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-3 py-1.5 bg-primary/10 text-primary font-extrabold rounded-lg">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-gray-heading-main transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
