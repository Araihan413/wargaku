import {
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
  File
} from "lucide-react";
import Link from "next/link";
import { TableSkeleton } from "@/components/TableSkeleton";
import { TablePagination } from "@/components/TablePagination";
import { FamilyItem } from "../types";

interface KKTableProps {
  families: FamilyItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
  isReadOnly?: boolean;
  onEdit: (family: FamilyItem) => void;
  onDisable: (family: FamilyItem) => void;
  onReactivate: (family: FamilyItem) => void;
}

export const KKTable: React.FC<KKTableProps> = ({
  families,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  isReadOnly = false,
  onEdit,
  onDisable,
  onReactivate,
}) => {
  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-4 px-5">Nomor KK</th>
              <th className="py-4 px-5">Kepala Keluarga</th>
              <th className="py-4 px-5">Alamat Alokasi</th>
              <th className="py-4 px-5 text-center">Jumlah Anggota</th>
              <th className="py-4 px-5">Status Verifikasi</th>
              <th className="py-4 px-5">Status Keaktifan</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <TableSkeleton rowCount={5} colCount={7} />
            ) : families.length > 0 ? (
              families.map((f) => {
                const addressParts = [
                  f.blockNumber ? `Blok ${f.blockNumber}` : "",
                  f.houseNumber ? `No. ${f.houseNumber}` : "",
                ].filter(Boolean);
                const addressStr = addressParts.join(" ") || "-";

                return (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-sidebar-hover/40 transition-colors"
                  >
                    <td className="py-4 px-5 font-mono text-sm font-semibold text-gray-heading-main">
                      {f.familyNumber}
                    </td>
                    <td className="py-4 px-5 font-medium text-gray-heading-main">
                      {f.headName}
                    </td>
                    <td className="py-4 px-5 text-gray-secondary-text">
                      <div>
                        <span className="text-gray-heading-main font-medium">{addressStr}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-bold text-gray-heading-main">
                      {f.memberCount} orang
                    </td>
                    <td className="py-4 px-5">
                      {f.verificationStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/20 px-2.5 py-0.5 text-xs font-bold text-success">
                          <CheckCircle className="h-3 w-3" />
                          Terverifikasi
                        </span>
                      )}
                      {f.verificationStatus === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-20 border border-warning/20 px-2.5 py-0.5 text-xs font-bold text-pending">
                          <AlertCircle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      {f.verificationStatus === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error/15 border border-error/20 px-2.5 py-0.5 text-xs font-bold text-error">
                          <XCircle className="h-3 w-3" />
                          Ditolak
                        </span>
                      )}
                      {f.verificationStatus === "draft" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                          <File className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {f.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-xs font-semibold text-success">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-500">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Lihat Detail */}
                        <Link
                          href={`/dashboard/residents/families/${f.id}`}
                          title="Lihat Detail & Anggota Keluarga"
                          className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>

                        {/* Edit KK */}
                        {!isReadOnly && f.isActive && (
                          <button
                            onClick={() => onEdit(f)}
                            title="Edit Kartu Keluarga"
                            className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {/* Nonaktifkan KK */}
                        {!isReadOnly && f.isActive && (
                          <button
                            onClick={() => onDisable(f)}
                            title="Nonaktifkan Kartu Keluarga"
                            className="p-1.5 text-gray-secondary-text hover:text-error hover:bg-error/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Ban className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {/* Aktifkan Kembali KK */}
                        {!isReadOnly && !f.isActive && (
                          <button
                            onClick={() => onReactivate(f)}
                            title="Aktifkan Kembali Kartu Keluarga"
                            className="p-1.5 text-gray-secondary-text hover:text-success hover:bg-success/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <RotateCcw className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <span className="text-sm text-gray-placeholder">
                    Tidak ditemukan Kartu Keluarga yang cocok dengan kriteria.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginasi Footer */}
      {!isLoading && families.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          currentItemsCount={families.length}
          itemLabel="data Kartu Keluarga"
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
