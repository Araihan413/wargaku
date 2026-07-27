"use client";

import { History } from "lucide-react";
import { RentalResidentItem } from "../types";

interface HistoryTabProps {
  inactiveResidents: RentalResidentItem[];
  onViewDetail: (resident: RentalResidentItem) => void;
}

export function HistoryTab({ inactiveResidents, onViewDetail }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      {inactiveResidents.length === 0 ? (
        <div className="rounded-3xl border border-gray-border bg-gray-card p-12 text-center shadow-sm">
          <History className="h-16 w-16 text-gray-placeholder mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-heading-main mb-1">Riwayat Kosong</h3>
          <p className="text-xs text-gray-secondary-text max-w-sm mx-auto leading-relaxed">
            Belum ada riwayat penyewa lama yang pernah keluar/check-out dari properti ini.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-border bg-gray-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-border bg-gray-sidebar-hover/20 text-gray-heading-main font-bold">
                  <th className="py-4 px-5">Nama Penyewa</th>
                  <th className="py-4 px-5">Kamar</th>
                  <th className="py-4 px-5 font-mono">NIK</th>
                  <th className="py-4 px-5">Tanggal Masuk</th>
                  <th className="py-4 px-5">Tanggal Keluar</th>
                  <th className="py-4 px-5">Keterangan</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inactiveResidents.map((res) => (
                  <tr key={res.id} className="border-b border-gray-border/60 hover:bg-gray-sidebar-hover/10 text-gray-secondary-text transition-colors">
                    <td className="py-4 px-5 font-bold text-gray-heading-main">{res.name}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-gray-sidebar-hover text-[10px] font-semibold text-gray-secondary-text">
                        {res.roomNumber || "No Room"}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono">{res.nik}</td>
                    <td className="py-4 px-5">
                      {new Date(res.checkInDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-5">
                      {res.checkOutDate ? (
                        new Date(res.checkOutDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {res.notes ? (
                        <span>
                          {res.inactiveReason && (
                            <span className={`mr-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              res.inactiveReason === "pindah"
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                : "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}>
                              {res.inactiveReason}
                            </span>
                          )}
                          {res.notes}
                        </span>
                      ) : (
                        res.inactiveReason ? (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            res.inactiveReason === "pindah"
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                              : "bg-rose-50 text-rose-600 border border-rose-100"
                          }`}>
                            {res.inactiveReason}
                          </span>
                        ) : "-"
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-1.5 py-0.5 rounded bg-gray-sidebar-hover text-[9px] font-bold uppercase tracking-wider text-gray-placeholder">
                        Inactive
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewDetail(res)}
                        className="px-2 py-1 text-[10px] font-bold border border-gray-border bg-white text-gray-secondary-text hover:text-primary hover:border-primary/50 transition-all rounded-lg cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
