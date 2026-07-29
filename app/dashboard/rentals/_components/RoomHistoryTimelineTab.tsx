import React, { useEffect, useState } from "react";
import { Clock, LogIn, RefreshCw } from "lucide-react";
import { RoomHistoryItem } from "../types";

interface RoomHistoryTimelineTabProps {
  propertyId: number;
  roomNumber: string;
  onOpenReactivate?: (historyItem: any) => void;
}

export const RoomHistoryTimelineTab: React.FC<RoomHistoryTimelineTabProps> = ({
  propertyId,
  roomNumber,
  onOpenReactivate,
}) => {
  const [history, setHistory] = useState<RoomHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/rentals/${propertyId}/rooms/${encodeURIComponent(roomNumber)}/history`);
        if (!res.ok) throw new Error("Gagal mengambil data riwayat kamar");
        const data = await res.json();
        setHistory(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [propertyId, roomNumber]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
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

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-gray-placeholder flex flex-col items-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat riwayat kamar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-xs text-error bg-red-50 rounded-xl p-4">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-gray-placeholder flex flex-col items-center gap-2">
        <Clock className="h-8 w-8 text-gray-border" />
        <span>Belum Ada Riwayat Penyewa</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider">
        Runut Waktu Former Tenants ({history.length})
      </h4>

      <div className="relative border-l-2 border-gray-border ml-3 space-y-6">
        {history.map((item) => (
          <div key={item.id} className="relative pl-6">
            {/* Timeline Dot */}
            <div className="absolute -left-2.25 top-1.5 h-4 w-4 rounded-full bg-gray-card border-2 border-gray-secondary-text flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-secondary-text" />
            </div>

            <div className="rounded-xl border border-gray-border bg-gray-card p-4 space-y-2 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-heading-main">{item.name}</div>
                  <div className="text-[10px] font-mono text-gray-placeholder">NIK: {item.nik}</div>
                </div>

                {onOpenReactivate && (
                  <button
                    type="button"
                    onClick={() => onOpenReactivate(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Kembalikan / Reactivate Penyewa"
                  >
                    <LogIn className="h-3 w-3" />
                    <span>Aktifkan</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-secondary-text pt-2 border-t border-gray-border/50">
                <div>
                  <span className="text-gray-placeholder block text-[9px] uppercase font-semibold">Tipe Sewa</span>
                  <span className="capitalize font-semibold text-gray-heading-main">{item.tenantType}</span>
                </div>
                <div>
                  <span className="text-gray-placeholder block text-[9px] uppercase font-semibold">Alasan Keluar</span>
                  <span className="capitalize font-semibold text-amber-700">{item.inactiveReason || "Check-Out"}</span>
                </div>
                <div>
                  <span className="text-gray-placeholder block text-[9px] uppercase font-semibold">Check-In</span>
                  <span className="font-medium text-gray-heading-main">{formatDate(item.checkInDate)}</span>
                </div>
                <div>
                  <span className="text-gray-placeholder block text-[9px] uppercase font-semibold">Check-Out</span>
                  <span className="font-medium text-gray-heading-main">{formatDate(item.checkOutDate)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
