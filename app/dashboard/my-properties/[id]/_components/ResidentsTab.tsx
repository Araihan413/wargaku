"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, Phone } from "lucide-react";
import { PropertyDetails, RentalResidentItem } from "../types";

interface ResidentsTabProps {
  property: PropertyDetails;
  activeResidents: RentalResidentItem[];
  parsedRooms: string[];
  isCoordinator: boolean;
  onCheckOut: (resident: RentalResidentItem) => void;
  onEdit: (resident: RentalResidentItem) => void;
  onResubmit: (residentId: number) => void;
  onDelete: (residentId: number) => void;
  onViewDetail: (resident: RentalResidentItem) => void;
}

export function ResidentsTab({
  property: _property,
  activeResidents,
  parsedRooms,
  isCoordinator,
  onCheckOut,
  onEdit,
  onResubmit,
  onDelete,
  onViewDetail,
}: ResidentsTabProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredResidents = useMemo(() => {
    return activeResidents.filter((res) => {
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.nik.includes(searchQuery) ||
        (res.roomNumber && res.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" || res.verificationStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activeResidents, searchQuery, filterStatus]);

  return (
    <div className="space-y-6">
    

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-card border border-gray-border p-4 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-placeholder" />
          <input
            type="text"
            placeholder="Cari nama penyewa atau nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-sidebar-hover/10 border border-gray-border rounded-xl pl-9 pr-4 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "all"
                ? "bg-primary border-primary text-white"
                : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
            }`}
          >
            Semua ({activeResidents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("verified")}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "verified"
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
            }`}
          >
            Verified ({activeResidents.filter(r => r.verificationStatus === "verified").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "pending"
                ? "bg-amber-600 border-amber-600 text-white"
                : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
            }`}
          >
            Pending ({activeResidents.filter(r => r.verificationStatus === "pending").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("rejected")}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "rejected"
                ? "bg-rose-600 border-rose-600 text-white"
                : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
            }`}
          >
            Rejected ({activeResidents.filter(r => r.verificationStatus === "rejected").length})
          </button>
        </div>
      </div>

      {/* Visual Room Grid */}
      {parsedRooms.length > 0 && (
        <div className="bg-gray-card border border-gray-border p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-heading-main">Denah Grid Kamar</h3>
            <p className="text-[10px] text-gray-secondary-text leading-relaxed">
              Klik nomor kamar untuk memfokuskan pencarian ke kamar tersebut.
            </p>
          </div>

          <div className="max-h-105 sm:max-h-51 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {parsedRooms.map((roomNum: string) => {
                const residentsInRoom = activeResidents.filter(r => r.roomNumber === roomNum);
                
                let gridStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
                let roomStatusText = "Kosong";
                let residentsName = "";

                if (residentsInRoom.length === 1) {
                  const res = residentsInRoom[0];
                  residentsName = res.name;
                  if (res.verificationStatus === "verified") {
                    gridStyle = "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
                    roomStatusText = "Terisi";
                  } else if (res.verificationStatus === "pending") {
                    gridStyle = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
                    roomStatusText = "Pending RT";
                  } else if (res.verificationStatus === "rejected") {
                    gridStyle = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
                    roomStatusText = "Ditolak RT";
                  }
                } else if (residentsInRoom.length > 1) {
                  gridStyle = "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
                  roomStatusText = `${residentsInRoom.length} Warga`;
                  residentsName = residentsInRoom.map(r => r.name).join(", ");
                }

                return (
                  <button
                    key={roomNum}
                    type="button"
                    onClick={() => setSearchQuery(roomNum)}
                    className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center h-24 cursor-pointer select-none transition-all ${gridStyle}`}
                    title={residentsName ? `Penyewa: ${residentsName}` : "Kamar Kosong"}
                  >
                    <span className="text-lg font-bold tracking-tight">{roomNum}</span>
                    <div className="space-y-0.5 w-full">
                      <span className="text-[9px] font-bold block uppercase tracking-wider leading-none opacity-85">
                        {roomStatusText}
                      </span>
                      {residentsName && (
                        <span className="text-[9px] block truncate font-semibold leading-none opacity-90 w-full max-w-20 mx-auto">
                          {residentsInRoom[0].name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Legend */}
          <div className="flex flex-wrap gap-4 pt-2 text-[10px] font-semibold text-gray-secondary-text justify-center sm:justify-start">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-emerald-50 border border-emerald-200" />
              <span>Kosong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-indigo-50 border border-indigo-200" />
              <span>Terisi (Verified)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-amber-50 border border-amber-200" />
              <span>Pending RT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-rose-50 border border-rose-200" />
              <span>Ditolak RT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-orange-50 border border-orange-200" />
              <span>Room Sharing</span>
            </div>
          </div>
        </div>
      )}

      {/* List of active residents */}
      {filteredResidents.length === 0 ? (
        <div className="rounded-3xl border border-gray-border bg-gray-card p-12 text-center shadow-sm">
          <Search className="h-16 w-16 text-gray-placeholder mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-heading-main mb-1">Hasil Tidak Ditemukan</h3>
          <p className="text-xs text-gray-secondary-text max-w-sm mx-auto leading-relaxed">
            Tidak ada penyewa yang cocok dengan kata kunci pencarian atau filter status yang Anda pilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredResidents.map((res) => (
            <div
              key={res.id}
              className="rounded-3xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-gray-heading-main line-clamp-1">{res.name}</h4>
                    <span className="text-[10px] text-gray-secondary-text font-mono uppercase">NIK: {res.nik}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold font-mono">
                    {res.roomNumber || "No Room"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-secondary-text">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-placeholder" />
                    <span>Check-In</span>
                  </div>
                  <div className="text-right font-semibold text-gray-heading-main">
                    {new Date(res.checkInDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-placeholder" />
                    <span>WhatsApp</span>
                  </div>
                  <div className="text-right font-mono text-gray-heading-main">{res.phone || "-"}</div>
                </div>

                {res.verificationStatus === "rejected" && res.verificationNote && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                    <span className="text-[9px] font-bold text-rose-700 block uppercase">Alasan Penolakan RT:</span>
                    <p className="text-[10px] text-rose-600 italic mt-0.5">&ldquo;{res.verificationNote}&rdquo;</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-border/50 flex justify-between items-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  res.verificationStatus === "verified"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : res.verificationStatus === "rejected"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : res.verificationStatus === "draft"
                    ? "bg-gray-100 text-gray-600 border border-gray-200"
                    : "bg-amber-50 text-amber-600 border border-amber-100 lse"
                }`}>
                  {res.verificationStatus === "draft" ? "Draf (KK)" : res.verificationStatus}
                </span>

                {isCoordinator ? (
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => onViewDetail(res)}
                      className="px-2.5 py-1 text-[11px] font-bold border border-gray-border bg-gray-card text-gray-secondary-text hover:text-primary hover:border-primary/50 transition-all rounded-lg cursor-pointer"
                    >
                      Detail
                    </button>
                    {res.verificationStatus === "verified" ? (
                      <>
                        <button
                          onClick={() => onEdit(res)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-gray-border bg-gray-card text-gray-secondary-text hover:text-primary hover:border-primary/50 transition-all rounded-lg cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onCheckOut(res)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all rounded-lg cursor-pointer"
                        >
                          Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(res)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-gray-border bg-gray-card text-gray-secondary-text hover:text-primary hover:border-primary/50 transition-all rounded-lg cursor-pointer"
                        >
                          Edit
                        </button>
                        {res.verificationStatus === "rejected" && (
                          <button
                            onClick={() => onResubmit(res.id)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all rounded-lg cursor-pointer"
                          >
                            Kirim
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(res.id)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-rose-100 bg-gray-card text-rose-600 hover:bg-rose-50/30 hover:border-rose-200 transition-all rounded-lg cursor-pointer"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => onViewDetail(res)}
                      className="px-2.5 py-1 text-[11px] font-bold border border-gray-border bg-gray-card text-gray-secondary-text hover:text-primary hover:border-primary/50 transition-all rounded-lg cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
