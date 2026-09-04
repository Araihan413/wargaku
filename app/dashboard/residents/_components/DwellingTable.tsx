import React from "react";
import { Pencil, Ban, CheckCircle, XCircle, Eye, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { TablePagination } from "@/components/TablePagination";
import { getAppBaseUrl } from "@/lib/config";


export interface DwellingItem {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: "permanen" | "kos" | "homestay";
  qrToken: string;
  isActive: boolean;
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  totalRooms?: number | null;
  tenantCount?: number | null;
}

interface DwellingTableProps {
  dwellings: DwellingItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
  isReadOnly?: boolean;
  onDetail: (dwelling: DwellingItem) => void;
  onEdit: (dwelling: DwellingItem) => void;
  onDisable: (dwelling: DwellingItem) => void;
}

export const DwellingTable: React.FC<DwellingTableProps> = ({
  dwellings,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  isReadOnly = false,
  onDetail,
  onEdit,
  onDisable,
}) => {
  const handleDownloadQr = async (d: DwellingItem) => {
    if (!d.qrToken) {
      toast.error("Token QR tidak ditemukan.");
      return;
    }
    try {
      const origin = getAppBaseUrl();
      const qrUrl = `${origin}/scan-qr?token=${encodeURIComponent(d.qrToken)}`;

      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `QR_Hunian_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`QR Code Blok ${d.blockNumber} No. ${d.houseNumber} berhasil diunduh.`);
    } catch {
      toast.error("Gagal mengunduh QR Code.");
    }
  };

  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-4 px-5">Alamat Fisik</th>
              <th className="py-4 px-5">Tipe Hunian</th>
              <th className="py-4 px-5">QR Code</th>
              <th className="py-4 px-5">Catatan</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <TableSkeleton rowCount={5} colCount={6} />
            ) : dwellings.length > 0 ? (
              dwellings.map((d) => {
                const addressStr = `Blok ${d.blockNumber} No. ${d.houseNumber}`;

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-sidebar-hover/40 transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-gray-heading-main">
                      {addressStr}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase w-fit ${
                          d.type === 'permanen' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : d.type === 'kos' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {d.type}
                        </span>
                        {d.type === 'kos' && d.totalRooms !== undefined && d.totalRooms !== null && (
                          <span className="text-[11px] font-semibold text-amber-600">
                            {d.tenantCount ?? 0} / {d.totalRooms} Kamar Terisi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {d.qrToken ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadQr(d)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer group shadow-2xs"
                          title={`Unduh QR Code - Blok ${d.blockNumber} No. ${d.houseNumber}`}
                        >
                          <QrCode className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                          <span>Unduh QR</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-placeholder">-</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-xs text-gray-secondary-text max-w-xs truncate">
                      {d.notes || "-"}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                        d.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {d.isActive ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Nonaktif
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => onDetail(d)}
                          className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-primary transition-colors cursor-pointer"
                          title="Detail Hunian"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => onEdit(d)}
                            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
                            title="Edit Hunian"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {!isReadOnly && d.isActive && (
                          <button
                            onClick={() => onDisable(d)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-secondary-text hover:text-error transition-colors cursor-pointer"
                            title="Nonaktifkan Hunian"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-placeholder text-sm">
                  Belum ada data hunian terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && dwellings.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          currentItemsCount={dwellings.length}
          itemLabel="data hunian"
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
