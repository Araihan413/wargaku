import React from "react";
import { ChevronLeft, ChevronRight, Eye, CheckCircle, LogOut, Pencil } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";

export interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType: "perorangan" | "keluarga";
  roomNumber?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  verificationStatus: "draft" | "pending" | "verified" | "rejected";
  isActive: boolean;
  verificationNote?: string | null;
  ktpFile?: string | null;
  gender?: "L" | "P" | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  propertyName: string;
  rentalPropertyId: number;
  blockNumber: string;
  houseNumber: string;
}

interface RentalTableProps {
  residents: RentalResidentItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
  isReadOnly?: boolean;
  onDetail: (resident: RentalResidentItem) => void;
  onVerify: (resident: RentalResidentItem) => void;
  onCheckOut: (resident: RentalResidentItem) => void;
  onEdit: (resident: RentalResidentItem) => void;
}

export const RentalTable: React.FC<RentalTableProps> = ({
  residents,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  isReadOnly = false,
  onDetail,
  onVerify,
  onCheckOut,
  onEdit,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-4 px-5">Penyewa</th>
              <th className="py-4 px-5">Properti & Kamar</th>
              <th className="py-4 px-5">Tipe</th>
              <th className="py-4 px-5">Check-In</th>
              <th className="py-4 px-5">Status Verifikasi</th>
              <th className="py-4 px-5">Status Keaktifan</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <TableSkeleton rowCount={5} colCount={7} />
            ) : residents.length > 0 ? (
              residents.map((r) => {
                const addressStr = `Blok ${r.blockNumber} No. ${r.houseNumber}`;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-sidebar-hover/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-semibold text-gray-heading-main">{r.name}</div>
                        <div className="text-[10px] text-gray-placeholder font-mono mt-0.5">{r.nik}</div>
                        {r.phone && <div className="text-[10px] text-gray-secondary-text mt-0.5">{r.phone}</div>}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-medium text-gray-heading-main">{r.propertyName}</div>
                        <div className="text-xs text-gray-secondary-text mt-0.5">
                          {addressStr} {r.roomNumber ? `- Kamar ${r.roomNumber}` : ""}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.tenantType === 'keluarga' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {r.tenantType}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-secondary-text text-xs">
                      <div>{formatDate(r.checkInDate)}</div>
                      {r.checkOutDate && (
                        <div className="text-[10px] text-red-500 mt-0.5">
                          s/d {formatDate(r.checkOutDate)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.verificationStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {r.verificationStatus === 'verified' ? 'Terverifikasi' : r.verificationStatus === 'rejected' ? 'Ditolak' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDetail(r)}
                          className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
                          title="Detail Penyewa"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => onEdit(r)}
                            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-primary transition-colors cursor-pointer"
                            title="Edit Data Penyewa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {!isReadOnly && r.verificationStatus === 'pending' && r.tenantType === 'perorangan' && (
                          <button
                            onClick={() => onVerify(r)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-secondary-text hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Verifikasi Dokumen KTP"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!isReadOnly && r.isActive && r.verificationStatus === 'verified' && (
                          <button
                            onClick={() => onCheckOut(r)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-secondary-text hover:text-red-600 transition-colors cursor-pointer"
                            title="Check-Out Penyewa"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-placeholder text-sm">
                  Belum ada data penyewa terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && residents.length > 0 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-border bg-gray-sidebar-hover/20">
          <div className="text-xs text-gray-secondary-text font-medium">
            Menampilkan <span className="font-semibold text-gray-heading-main">{residents.length}</span> dari{" "}
            <span className="font-semibold text-gray-heading-main">{totalItems}</span> data penyewa
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
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
              disabled={currentPage === totalPages || isLoading}
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
