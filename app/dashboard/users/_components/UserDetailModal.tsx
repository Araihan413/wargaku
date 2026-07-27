import React from "react";
import { X, User, Mail, CreditCard, Phone, Shield, Calendar, Activity } from "lucide-react";
import { UserItem } from "../types";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header — shrink-0 agar tidak ikut scroll */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Detail Profil Pengguna
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable dengan scrollbar tipis */}
        <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">

          {/* Avatar Profile Section */}
          <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-gray-border/60">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-900-20 border border-primary/20 text-primary-900 mb-3 shadow-sm">
              <User className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-gray-heading-main">
              {user.name}
            </h4>
            <span className="text-xs text-gray-secondary-text mt-0.5">
              ID: <span className="font-mono text-[10px]">{user.id}</span>
            </span>
          </div>

          {/* Info Rows */}
          <div className="space-y-3.5">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Alamat Email
                </span>
                <span className="text-sm font-semibold text-gray-heading-main truncate block">
                  {user.email}
                </span>
              </div>
            </div>

            {/* NIK */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Nomor Induk Kependudukan (NIK)
                </span>
                <span className="text-sm font-semibold font-mono text-gray-heading-main">
                  {user.nik || "-"}
                </span>
              </div>
            </div>

            {/* Telepon */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Nomor Telepon
                </span>
                <span className="text-sm font-semibold text-gray-heading-main">
                  {user.phone || "-"}
                </span>
              </div>
            </div>

            {/* Peran Sistem */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Peran Akses (Role)
                </span>
                <span className="inline-flex rounded-lg bg-primary-900-20 border border-primary/20 px-2 py-0.5 mt-0.5 text-xs font-semibold text-primary-900">
                  {user.roleName}
                </span>
              </div>
            </div>

            {/* Status Akun */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider mb-0.5">
                  Status Akun
                </span>
                {user.status === "active" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/20 px-2.5 py-0.5 text-xs font-bold text-success">
                    Aktif
                  </span>
                )}
                {user.status === "suspended" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-error/15 border border-error/20 px-2.5 py-0.5 text-xs font-bold text-error">
                    Ditangguhkan
                  </span>
                )}
                {user.status === "pending" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning-20 border border-warning/20 px-2.5 py-0.5 text-xs font-bold text-pending">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Tanggal Terdaftar */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-sidebar-hover rounded-lg border border-gray-border text-gray-placeholder">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Terdaftar Sejak
                </span>
                <span className="text-sm font-semibold text-gray-heading-main">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — shrink-0 agar tidak ikut scroll */}
        <div className="flex justify-end border-t border-gray-border pt-4 mt-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-border px-5 py-2 text-sm font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
