import React from "react";
import { X, Activity, User, Shield, Terminal, Globe } from "lucide-react";
import { AuditLogItem } from "../types";

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatIp = (ip?: string | null) => {
    if (!ip) return "127.0.0.1";
    if (ip === "::1" || ip.includes("0000:0000:0000:0000") || ip === "::ffff:127.0.0.1") {
      return "127.0.0.1";
    }
    return ip;
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-gray-card border border-gray-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-heading-main tracking-tight">
                Rincian Log Audit #{log.id}
              </h3>
              <p className="text-xs text-gray-secondary-text">
                Detail rekam jejak aktivitas keamanan sistem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-placeholder hover:text-gray-heading-main hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pelaku */}
            <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
                <User className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Pelaku Utama</span>
              </div>
              <p className="text-sm font-extrabold text-gray-heading-main truncate">
                {log.actorName || "Sistem"}
              </p>
              <p className="text-[11px] text-gray-secondary-text font-mono truncate">
                NIK: {log.actorNik || "-"}
              </p>
            </div>

            {/* Role & Access */}
            <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Peran / Role Pengguna</span>
              </div>
              <p className="text-sm font-extrabold text-indigo-700 truncate">
                {log.actorRoleName || "Super Admin"}
              </p>
              <p className="text-[11px] text-gray-secondary-text truncate">
                Email: {log.actorEmail || "-"}
              </p>
            </div>

            {/* Modul & Aksi */}
            <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Modul & Tipe Aksi</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-700 break-all">
                {log.module} / {log.action}
              </p>
            </div>

            {/* Waktu & IP */}
            <div className="p-3 bg-gray-50/80 border border-gray-border/60 rounded-xl space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-gray-secondary-text font-bold text-[11px]">
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Waktu & IP Address</span>
              </div>
              <p className="text-xs font-mono font-extrabold text-gray-heading-main break-all leading-tight">
                {formatIp(log.ipAddress)}
              </p>
              <p className="text-[11px] text-gray-secondary-text">
                {formatDate(log.createdAt)}
              </p>
            </div>
          </div>


          {/* Deskripsi Detail Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-heading-main">
              Deskripsi Rekam Aksi Detail:
            </label>
            <div className="p-3 bg-gray-100/90 border border-gray-border rounded-xl text-gray-heading-main font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {log.description || "Tidak ada deskripsi rincian tambahan."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-heading-main rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};
