import React from "react";
import { Eye } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
import { ComplaintReportItem, ReportPagination } from "../types";

interface ComplaintsTableProps {
  data: ComplaintReportItem[];
  pagination: ReportPagination;
  onPageChange: (page: number) => void;
  onSelectItem: (item: ComplaintReportItem) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  menunggu: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  proses: {
    label: "Diproses",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  selesai: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  ditolak: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const categoryConfig: Record<string, string> = {
  Infrastruktur: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Kebersihan: "bg-green-100 text-green-800 border-green-200",
  Keamanan: "bg-red-100 text-red-800 border-red-200",
  Sosial: "bg-purple-100 text-purple-800 border-purple-200",
  Lainnya: "bg-gray-100 text-gray-800 border-gray-200",
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const ComplaintsTable: React.FC<ComplaintsTableProps> = ({
  data,
  pagination,
  onPageChange,
  onSelectItem,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Kode Laporan</th>
              <th className="py-3.5 px-4">Pelapor</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4">Deskripsi</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4">Tanggal Lapor</th>
              <th className="py-3.5 px-4 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-secondary-text font-medium">
                  Tidak ada data pengaduan yang ditemukan.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const status = statusConfig[item.status] || {
                  label: item.status,
                  className: "bg-gray-100 text-gray-700 border-gray-200",
                };
                const catClass = categoryConfig[item.category] || "bg-gray-100 text-gray-700 border-gray-200";
                return (
                  <tr key={item.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {item.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-heading-main">{item.reporterName}</div>
                      {item.reporterPhone && (
                        <div className="text-[10px] text-gray-secondary-text">{item.reporterPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${catClass}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-heading-main max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-secondary-text whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        title="Lihat Detail Aduan"
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-heading-main rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </button>
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
          itemLabel="pengaduan"
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
