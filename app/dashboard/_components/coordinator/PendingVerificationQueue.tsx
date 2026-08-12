import React from "react";
import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { PendingRenterItem } from "./types";

interface PendingVerificationQueueProps {
  pendingList: PendingRenterItem[];
}

export const PendingVerificationQueue: React.FC<PendingVerificationQueueProps> = ({ pendingList = [] }) => {
  const safePendingList = Array.isArray(pendingList) ? pendingList : [];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-border pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-heading-main flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>Antrean Verifikasi Dokumen Penyewa (RT)</span>
          </h2>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Penyewa baru yang didaftarkan dan sedang menunggu persetujuan berkas dari RT.
          </p>
        </div>
        <Link
          href="/dashboard/rentals"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-900 transition-colors"
        >
          <span>Lihat Semua Penyewa</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {safePendingList.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-placeholder flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 text-gray-border" />
          <span>Tidak ada antrean penyewa baru yang menunggu verifikasi RT saat ini.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Penyewa</th>
                <th className="py-3 px-4">Properti & Kamar</th>
                <th className="py-3 px-4">Tipe Sewa</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-xs text-gray-heading-main">
              {safePendingList.map((r) => (
                <tr key={r.id} className="hover:bg-gray-sidebar-hover/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-heading-main">{r.name}</div>
                    <div className="text-[10px] text-gray-placeholder font-mono mt-0.5">{r.nik}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-heading-main">{r.propertyName}</div>
                    <div className="text-[10px] text-gray-secondary-text mt-0.5">
                      {r.roomNumber ? `Kamar / Unit ${r.roomNumber}` : "Utama"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.tenantType === "keluarga"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {r.tenantType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-secondary-text">
                    {formatDate(r.checkInDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3 animate-spin" /> Pending RT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
