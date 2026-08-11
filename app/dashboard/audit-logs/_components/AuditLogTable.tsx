import React from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { AuditLogItem, AuditLogPagination } from "../types";

interface AuditLogTableProps {
  logs: AuditLogItem[];
  pagination: AuditLogPagination;
  onPageChange: (newPage: number) => void;
  onSelectLog: (log: AuditLogItem) => void;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getModuleBadgeStyle = (mod: string) => {
  switch (mod.toLowerCase()) {
    case "pengguna":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "keuangan":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "kependudukan":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "verifikasi":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "hunian":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  pagination,
  onPageChange,
  onSelectLog,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Waktu</th>
              <th className="py-3.5 px-4">Pelaku (User)</th>
              <th className="py-3.5 px-4">Modul</th>
              <th className="py-3.5 px-4">Aksi</th>
              <th className="py-3.5 px-4">Deskripsi Detail</th>
              <th className="py-3.5 px-4 text-center">IP Address</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-gray-secondary-text font-medium"
                >
                  Tidak ada catatan log aktivitas yang ditemukan.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-sidebar-hover/20 transition-colors"
                >
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 font-semibold text-gray-heading-main whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>

                  {/* Pelaku */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-gray-heading-main">
                      {log.actorName || "Sistem"}
                    </div>
                    <div className="text-[10px] text-gray-secondary-text">
                      {log.actorRoleName} {log.actorNik ? `• NIK: ${log.actorNik}` : ""}
                    </div>
                  </td>

                  {/* Modul */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${getModuleBadgeStyle(
                        log.module
                      )}`}
                    >
                      {log.module}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 font-bold text-primary whitespace-nowrap">
                    {log.action}
                  </td>

                  {/* Deskripsi */}
                  <td className="py-3.5 px-4 text-gray-heading-main max-w-xs truncate">
                    {log.description || "-"}
                  </td>

                  {/* IP Address */}
                  <td className="py-3.5 px-4 text-center font-mono text-gray-secondary-text whitespace-nowrap">
                    {!log.ipAddress || log.ipAddress === "::1" || log.ipAddress.includes("0000:0000:0000:0000") || log.ipAddress === "::ffff:127.0.0.1" ? "127.0.0.1" : log.ipAddress}
                  </td>


                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectLog(log)}
                      title="Lihat Detail Log"
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-heading-main rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-gray-secondary-text font-medium">
            Menampilkan data ke{" "}
            <strong>
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalLogs
              )}
            </strong>{" "}
            dari total <strong>{pagination.totalLogs}</strong> log
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
