import React from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import { UserItem } from "../types";

interface UserTableProps {
  users: UserItem[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
  currentUserId: string;
  onMutateRole: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onToggleSuspend: (user: UserItem, targetStatus: "active" | "suspended") => void;
  onEdit: (user: UserItem) => void;
  onDetail: (user: UserItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  currentUserId,
  onMutateRole,
  onResetPassword,
  onToggleSuspend,
  onEdit,
  onDetail,
}) => {
  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
              <th className="py-4 px-5">Nama & Email</th>
              <th className="py-4 px-5">NIK</th>
              <th className="py-4 px-5">Telepon</th>
              <th className="py-4 px-5">Peran</th>
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
                      Memuat data pengguna...
                    </span>
                  </div>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                const isOtherSuperAdmin = u.roleId === 1 && !isSelf;
                // Actions blocked: self (own role/status), or other SA
                const isRoleOrStatusBlocked = isSelf || isOtherSuperAdmin;

                return (
                <tr
                  key={u.id}
                  className="hover:bg-gray-sidebar-hover/40 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-heading-main">
                          {u.name}
                        </span>
                        {isSelf && (
                          <span className="inline-flex rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0 text-[9px] font-bold text-primary uppercase tracking-wide">
                            Anda
                          </span>
                        )}
                        {isOtherSuperAdmin && (
                          <span title="Akun Super Admin terlindungi">
                            <ShieldAlert className="h-3.5 w-3.5 text-warning shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-secondary-text">
                        {u.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-gray-body-text-btn">
                    {u.nik || "-"}
                  </td>
                  <td className="py-4 px-5 text-gray-body-text-btn">
                    {u.phone || "-"}
                  </td>
                  <td className="py-4 text-center px-5">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {(u.roleIds && u.roleIds.length > 0 ? u.roleIds : [u.roleId]).map((rId) => {
                        const roleNamesMap: Record<number, string> = {
                          1: "Super Admin",
                          2: "Ketua RT",
                          3: "Sekretaris",
                          4: "Bendahara",
                          5: "Koordinator Kost",
                          6: "Warga",
                        };
                        return (
                          <span
                            key={rId}
                            className="inline-flex rounded-lg bg-primary-900-20 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary-900"
                          >
                            {roleNamesMap[rId] || "Pengguna"}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    {u.status === "active" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/20 px-2.5 py-0.5 text-xs font-bold text-success">
                        Aktif
                      </span>
                    )}
                    {u.status === "suspended" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-error/15 border border-error/20 px-2.5 py-0.5 text-xs font-bold text-error">
                        Ditangguhkan
                      </span>
                    )}
                    {u.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-20 border border-warning/20 px-2.5 py-0.5 text-xs font-bold text-pending">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      {/* Lihat Detail */}
                      <button
                        onClick={() => onDetail(u)}
                        title="Lihat Detail"
                        className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>

                      {/* Edit Profil */}
                      <button
                        onClick={() => !isOtherSuperAdmin && onEdit(u)}
                        title={isOtherSuperAdmin ? "Super Admin lain tidak dapat diedit" : "Edit Profil"}
                        disabled={isOtherSuperAdmin}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isOtherSuperAdmin
                            ? "text-gray-border cursor-not-allowed"
                            : "text-gray-secondary-text hover:text-primary hover:bg-primary/10 cursor-pointer"
                        }`}
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>

                      {/* Mutasi Peran */}
                      <button
                        onClick={() => !isRoleOrStatusBlocked && onMutateRole(u)}
                        title={isRoleOrStatusBlocked ? (isSelf ? "Tidak dapat mengubah peran sendiri" : "Peran Super Admin terlindungi") : "Mutasi Peran"}
                        disabled={isRoleOrStatusBlocked}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isRoleOrStatusBlocked
                            ? "text-gray-border cursor-not-allowed"
                            : "text-gray-secondary-text hover:text-primary hover:bg-primary/10 cursor-pointer"
                        }`}
                      >
                        <RefreshCw className="h-4.5 w-4.5" />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => onResetPassword(u)}
                        title="Reset Password"
                        className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                      >
                        <Lock className="h-4.5 w-4.5" />
                      </button>

                      {/* Suspend / Approve Toggles */}
                      {u.status === "pending" ? (
                        <>
                          <button
                            onClick={() => !isRoleOrStatusBlocked && onToggleSuspend(u, "active")}
                            title={isRoleOrStatusBlocked ? "Tidak dapat menyetujui akun ini" : "Setujui Akun Warga"}
                            disabled={isRoleOrStatusBlocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isRoleOrStatusBlocked
                                ? "text-gray-border cursor-not-allowed"
                                : "text-success hover:bg-success/10 cursor-pointer"
                            }`}
                          >
                            <UserCheck className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => !isRoleOrStatusBlocked && onToggleSuspend(u, "suspended")}
                            title={isRoleOrStatusBlocked ? "Tidak dapat menangguhkan akun ini" : "Tolak/Tangguhkan Akun"}
                            disabled={isRoleOrStatusBlocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isRoleOrStatusBlocked
                                ? "text-gray-border cursor-not-allowed"
                                : "text-error hover:bg-error/10 cursor-pointer"
                            }`}
                          >
                            <UserX className="h-4.5 w-4.5" />
                          </button>
                        </>
                      ) : u.status === "suspended" ? (
                        <button
                          onClick={() => !isRoleOrStatusBlocked && onToggleSuspend(u, "active")}
                          title={isRoleOrStatusBlocked ? "Tidak dapat mengaktifkan akun ini" : "Aktifkan Akun"}
                          disabled={isRoleOrStatusBlocked}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isRoleOrStatusBlocked
                              ? "text-gray-border cursor-not-allowed"
                              : "text-success hover:bg-success/10 cursor-pointer"
                          }`}
                        >
                          <UserCheck className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => !isRoleOrStatusBlocked && onToggleSuspend(u, "suspended")}
                          title={isRoleOrStatusBlocked ? (isSelf ? "Tidak dapat menangguhkan akun sendiri" : "Super Admin terlindungi") : "Tangguhkan Akun"}
                          disabled={isRoleOrStatusBlocked}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isRoleOrStatusBlocked
                              ? "text-gray-border cursor-not-allowed"
                              : "text-error hover:bg-error/10 cursor-pointer"
                          }`}
                        >
                          <UserX className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <span className="text-sm text-gray-placeholder">
                    Tidak ditemukan pengguna yang cocok dengan kriteria
                    pencarian.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginasi Footer */}
      {!isLoading && users.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-border bg-gray-card px-5 py-4">
          <div className="text-xs text-gray-secondary-text">
            Menampilkan{" "}
            <span className="font-semibold text-gray-heading-main">
              {users.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-heading-main">
              {totalItems}
            </span>{" "}
            data
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-gray-heading-main">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
