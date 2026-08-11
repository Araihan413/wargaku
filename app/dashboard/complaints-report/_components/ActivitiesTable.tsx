import React from "react";
import { Pin, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityReportItem, ReportPagination } from "../types";

interface ActivitiesTableProps {
  data: ActivityReportItem[];
  pagination: ReportPagination;
  onPageChange: (page: number) => void;
}

const formatEventDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isUpcoming = (dateStr: string | null) => {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date();
};

export const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
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
              <th className="py-3.5 px-4">Nama Kegiatan</th>
              <th className="py-3.5 px-4">Tanggal & Waktu</th>
              <th className="py-3.5 px-4">Lokasi</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Pin</th>
              <th className="py-3.5 px-4">Dibuat Oleh</th>
              <th className="py-3.5 px-4">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-secondary-text font-medium">
                  Tidak ada agenda kegiatan yang ditemukan.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const upcoming = isUpcoming(item.eventDate);
                return (
                  <tr key={item.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-heading-main max-w-45">
                      <div className="truncate">{item.title}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-heading-main">
                        {formatEventDate(item.eventDate)}
                      </div>
                      <div className="text-[10px] text-gray-secondary-text">
                        {formatTime(item.eventDate)} WIB
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.location ? (
                        <span className="inline-flex items-center gap-1 text-gray-heading-main">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate max-w-30">{item.location}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                          upcoming
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {upcoming ? "Mendatang" : "Selesai"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isPinned ? (
                        <Pin className="w-3.5 h-3.5 text-amber-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-heading-main font-semibold whitespace-nowrap">
                      {item.creatorName || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-secondary-text max-w-xs truncate">
                      {item.description || "—"}
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
            {" dari "}<strong>{pagination.totalItems}</strong> kegiatan
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
