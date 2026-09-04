import React from "react";
import { Pin } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
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
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
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

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          currentItemsCount={data.length}
          itemLabel="pengumuman"
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
