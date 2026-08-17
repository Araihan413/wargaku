"use client";

import React, { useState } from "react";
import { UserCheck, Check, X, ChevronRight, Clock } from "lucide-react";
import { PendingRegistrationItem } from "./types";
import Link from "next/link";
import { toast } from "sonner";

interface PendingRegistrationQueueProps {
  registrations: PendingRegistrationItem[];
  onRefresh: () => void;
}

export const PendingRegistrationQueue: React.FC<PendingRegistrationQueueProps> = ({
  registrations,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/approvals/registration/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(`Akun warga berhasil ${action === "approve" ? "disetujui (Aktif)" : "ditolak"}`);
        onRefresh();
      } else {
        toast.error("Gagal memproses pendaftaran akun");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Persetujuan Akun Warga Mandiri
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Verifikasi pendaftaran akun Kepala Keluarga baru (Pending).
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/approvals/registration"
          className="inline-flex items-center self-end sm:self-auto gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-gray-secondary-text">
          <Clock className="h-8 w-8 text-gray-border mb-2" />
          <span>Tidak ada pendaftaran akun pending saat ini.</span>
        </div>
      ) : (
        <div className="divide-y divide-gray-border/60">
          {registrations.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-sidebar-hover/30 px-2 rounded-xl transition-all"
            >
              <div className="space-y-0.5 truncate">
                <strong className="text-sm font-extrabold text-gray-heading-main block truncate">
                  {item.name}
                </strong>
                <p className="text-xs text-gray-secondary-text truncate">
                  {item.email} • NIK: {item.nik || "-"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "approve")}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item.id, "reject")}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
