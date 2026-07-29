"use client";

import React from "react";
import { UserX, Home, UserCheck, Phone, Mail, Eye, Pencil, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface CoordinatorItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  nik?: string | null;
  status: "active" | "pending" | "suspended";
  propertiesCount: number;
}

interface CoordinatorTableProps {
  coordinators: CoordinatorItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
  isReadOnly?: boolean;
  onDetail: (coord: CoordinatorItem) => void;
  onEdit: (coord: CoordinatorItem) => void;
  onDeactivate: (coord: CoordinatorItem) => void;
}

export const CoordinatorTable: React.FC<CoordinatorTableProps> = ({
  coordinators,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  isReadOnly = false,
  onDetail,
  onEdit,
  onDeactivate,
}) => {
  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
              <th className="py-4 px-5">Nama & NIK</th>
              <th className="py-4 px-5">Kontak</th>
              <th className="py-4 px-5 text-center">Kelola Properti</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs text-gray-placeholder">
                      Memuat data koordinator kos...
                    </span>
                  </div>
                </td>
              </tr>
            ) : coordinators.length > 0 ? (
              coordinators.map((c) => (
                <tr key={c.id} className="hover:bg-gray-sidebar-hover/20 transition-all">
                  {/* Nama & NIK */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/5 text-primary">
                        <UserCheck className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-heading-main block text-sm">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-secondary-text block mt-0.5">
                          NIK: {c.nik || "Tidak diisi"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Kontak */}
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-heading-main font-semibold">
                        <Mail className="h-3.5 w-3.5 text-gray-placeholder" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-gray-secondary-text">
                          <Phone className="h-3.5 w-3.5 text-gray-placeholder" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Jumlah Kos */}
                  <td className="py-4 px-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-sidebar-hover text-xs font-semibold text-gray-heading-main">
                      <Home className="h-3.5 w-3.5 text-gray-secondary-text" />
                      <span>{c.propertiesCount} Properti Kos</span>
                    </div>
                  </td>

                  {/* Status Akun */}
                  <td className="py-4 px-5">
                    {c.status === "active" ? (
                      <span className="inline-flex rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[10px] font-bold text-success">
                        Aktif
                      </span>
                    ) : c.status === "pending" ? (
                      <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDetail(c)}
                        className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
                        title="Detail Koordinator"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => onEdit(c)}
                          className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-primary transition-colors cursor-pointer"
                          title="Edit Data Koordinator"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {!isReadOnly && c.status !== "suspended" && (
                        <button
                          onClick={() => onDeactivate(c)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-secondary-text hover:text-error transition-colors cursor-pointer"
                          title="Copot Jabatan Koordinator"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-placeholder text-sm">
                  Belum ada koordinator kos yang terdaftar di wilayah RT ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-border bg-gray-sidebar-hover/20">
          <div className="text-xs text-gray-secondary-text font-medium">
            Menampilkan <span className="font-semibold text-gray-heading-main">{coordinators.length}</span> dari{" "}
            <span className="font-semibold text-gray-heading-main">{totalItems}</span> koordinator
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
