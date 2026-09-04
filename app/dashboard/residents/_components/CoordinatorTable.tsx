"use client";

import React from "react";
import { UserX, Home, Phone, Mail, Eye, Pencil } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { TablePagination } from "@/components/TablePagination";

export interface CoordinatorProperty {
  id: number;
  name: string;
  isOwnedByCoordinator?: boolean;
}

export interface CoordinatorItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: "active" | "pending" | "suspended";
  propertiesCount: number;
  properties?: CoordinatorProperty[];
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
        <table className="w-full text-left border-collapse text-xs">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-4 px-5 min-w-50">Nama Koordinator</th>
              <th className="py-4 px-5">Kontak</th>
              <th className="py-4 px-5 min-w-45">Kos yang Dikelola</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
            {isLoading ? (
              <TableSkeleton rowCount={5} colCount={5} />
            ) : coordinators.length > 0 ? (
              coordinators.map((c) => (
                <tr key={c.id} className="hover:bg-gray-sidebar-hover/20 transition-all">
                  {/* Nama Koordinator */}
                  <td className="py-4 px-5">
                    <span className="font-bold text-gray-heading-main block text-sm">
                      {c.name}
                    </span>
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

                  {/* Kos yang Dikelola */}
                  <td className="py-4 px-5">
                    {c.properties && c.properties.length > 0 ? (
                      <div className="flex flex-col gap-1.5 justify-center">
                        {c.properties.map((p) => (
                          <div key={p.id} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-heading-main">
                            <Home className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-placeholder italic">Belum ada kos</span>
                    )}
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
      {!isLoading && coordinators.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          currentItemsCount={coordinators.length}
          itemLabel="data koordinator"
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
