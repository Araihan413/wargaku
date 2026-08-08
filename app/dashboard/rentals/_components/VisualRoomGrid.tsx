import React, { useState } from "react";
import { RoomGridItem } from "../types";
import { Home, CheckCircle2, Clock, UserPlus } from "lucide-react";

interface VisualRoomGridProps {
  rooms: RoomGridItem[];
  onSelectRoom: (room: RoomGridItem) => void;
  selectedRoomNumber: string | null;
}

export const VisualRoomGrid: React.FC<VisualRoomGridProps> = ({
  rooms,
  onSelectRoom,
  selectedRoomNumber,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "vacant" | "occupied" | "sharing">("all");

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-heading-main flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <span>Denah & Grid Unit Kamar</span>
          </h2>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Klik pada kartu kamar untuk melihat biodata penghuni aktif atau riwayat kamar.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-gray-sidebar-hover/60 p-1 rounded-xl border border-gray-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterStatus === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Semua ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("vacant")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterStatus === "vacant"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Kosong ({rooms.filter((r) => r.status === "vacant").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("occupied")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterStatus === "occupied"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Terisi ({rooms.filter((r) => r.status === "occupied").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("sharing")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterStatus === "sharing"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Kongsi ({rooms.filter((r) => r.status === "sharing").length})
          </button>
        </div>
      </div>

      {/* Grid Container */}
      {filteredRooms.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-placeholder">
          Tidak ada kamar yang sesuai dengan filter yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomNumber === room.roomNumber;
            const residentsList = room.residents || [];
            const primaryResident = residentsList[0];
            const hasPending = residentsList.some((r) => r.verificationStatus === "pending");
            const hasRejected = residentsList.some((r) => r.verificationStatus === "rejected");

            return (
              <div
                key={room.roomNumber}
                onClick={() => onSelectRoom(room)}
                className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 shadow-sm flex flex-col justify-between min-h-35 ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : room.status === "vacant"
                    ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50/60"
                    : room.status === "occupied"
                    ? "border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50/60"
                    : "border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/60"
                }`}
              >
                {/* Top Badge & Room Number */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-secondary-text">
                      Unit / Room
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-heading-main">
                      Kamar {room.roomNumber}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      room.status === "vacant"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : room.status === "occupied"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {room.status === "vacant"
                      ? "Kosong"
                      : room.status === "occupied"
                      ? "Terisi"
                      : `Kongsi (${room.residentsCount})`}
                  </span>
                </div>

                {/* Resident Info or Vacant Placeholder */}
                <div className="my-3 space-y-1">
                  {room.status === "vacant" ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <UserPlus className="h-4 w-4" />
                      <span>Siap Huni - Klik untuk Check-In</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-gray-heading-main truncate">
                        {primaryResident?.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-secondary-text mt-0.5">
                        <span className="capitalize">{primaryResident?.tenantType}</span>
                        {room.residentsCount > 1 && (
                          <span className="font-semibold text-amber-700 bg-amber-100 px-1 rounded">
                            +{room.residentsCount - 1} Lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Verification / Status Note */}
                <div className="pt-2 border-t border-gray-border/50 flex items-center justify-between text-[11px]">
                  {hasPending ? (
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <Clock className="h-3 w-3 animate-spin" /> Pending RT
                    </span>
                  ) : hasRejected ? (
                    <span className="flex items-center gap-1 font-semibold text-rose-700">
                      Ditolak RT
                    </span>
                  ) : room.status !== "vacant" ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                    </span>
                  ) : (
                    <span className="text-gray-placeholder text-[10px]">Belum Ada Penyewa</span>
                  )}

                  <span className="text-xs font-bold text-primary hover:underline">Detail &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
