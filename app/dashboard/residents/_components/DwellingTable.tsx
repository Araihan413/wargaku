import React from "react";
import { Loader2, ChevronLeft, ChevronRight, Pencil, Ban, CheckCircle, XCircle, Eye } from "lucide-react";

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
  occupiedRooms?: number | null;
}

interface DwellingTableProps {
  dwellings: DwellingItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
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
  onDetail,
  onEdit,
  onDisable,
}) => {
  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
              <th className="py-4 px-5">Alamat Fisik</th>
              <th className="py-4 px-5">Tipe Hunian</th>
              <th className="py-4 px-5">QR Token</th>
              <th className="py-4 px-5">Catatan</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs text-gray-placeholder">
                      Memuat data hunian...
                    </span>
                  </div>
                </td>
              </tr>
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
                            {d.occupiedRooms ?? 0} / {d.totalRooms} Kamar Terisi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-gray-secondary-text">
                      {d.qrToken}
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
                        <button
                          onClick={() => onEdit(d)}
                          className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
                          title="Edit Hunian"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {d.isActive && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-border bg-gray-sidebar-hover/20">
          <div className="text-xs text-gray-secondary-text font-medium">
            Menampilkan <span className="font-semibold text-gray-heading-main">{dwellings.length}</span> dari{" "}
            <span className="font-semibold text-gray-heading-main">{totalItems}</span> hunian
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-gray-border rounded-lg bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-gray-secondary-text">
              Halaman <span className="text-gray-heading-main">{currentPage}</span> dari{" "}
              <span className="text-gray-heading-main">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gray-border rounded-lg bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text disabled:opacity-40 disabled:hover:bg-gray-card cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
