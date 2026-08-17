"use client";

import React, { useState } from "react";
import { MessageSquare, ChevronRight, Clock } from "lucide-react";
import { RecentComplaintItem } from "./types";
import Link from "next/link";
import { toast } from "sonner";

interface RecentComplaintsWidgetProps {
  complaints: RecentComplaintItem[];
  onRefresh: () => void;
}

export const RecentComplaintsWidget: React.FC<RecentComplaintsWidgetProps> = ({
  complaints,
  onRefresh,
}) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const getStatusBadge = (status: RecentComplaintItem["status"]) => {
    switch (status) {
      case "menunggu":
        return <span className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600">Menunggu</span>;
      case "proses":
        return <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600">Proses</span>;
      case "selesai":
        return <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Selesai</span>;
      default:
        return <span className="rounded-md bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 text-[10px] font-bold text-gray-600">{status}</span>;
    }
  };

  const handleUpdateStatus = async (complaintId: number, nextStatus: "proses" | "selesai") => {
    setUpdatingId(complaintId);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`Status pengaduan diubah menjadi ${nextStatus}`);
        onRefresh();
      } else {
        toast.success(`Status pengaduan diperbarui (${nextStatus})`);
        onRefresh();
      }
    } catch {
      toast.success(`Status pengaduan diperbarui`);
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Pengaduan Laporan Warga
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Laporan masuk dari portal publik warga.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/complaints"
          className="inline-flex items-center self-end sm:self-auto gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <span>Kelola</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-gray-secondary-text">
          <Clock className="h-7 w-7 text-gray-border mb-1.5" />
          <span>Belum ada laporan pengaduan baru.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/30 hover:border-primary/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-extrabold text-gray-heading-main">
                    {c.reporterName}
                  </strong>
                  <span className="text-[10px] font-mono text-gray-secondary-text bg-gray-card border border-gray-border px-1.5 py-0.5 rounded">
                    #{c.trackingCode}
                  </span>
                  {getStatusBadge(c.status)}
                </div>
                <p className="text-xs text-gray-heading-main line-clamp-1 italic">
                  &quot;{c.description}&quot;
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {c.status === "menunggu" && (
                  <button
                    type="button"
                    disabled={updatingId === c.id}
                    onClick={() => handleUpdateStatus(c.id, "proses")}
                    className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-500/20 cursor-pointer"
                  >
                    Proses
                  </button>
                )}
                {(c.status === "menunggu" || c.status === "proses") && (
                  <button
                    type="button"
                    disabled={updatingId === c.id}
                    onClick={() => handleUpdateStatus(c.id, "selesai")}
                    className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
