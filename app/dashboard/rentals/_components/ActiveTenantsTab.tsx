import React from "react";
import { Phone, Calendar, MapPin, UserPlus, LogOut, Edit, FileText } from "lucide-react";
import { ActiveTenantInfo } from "../types";

interface ActiveTenantsTabProps {
  roomNumber: string;
  residents: ActiveTenantInfo[];
  onOpenCheckIn: () => void;
  onOpenEdit: (resident: ActiveTenantInfo) => void;
  onOpenCheckOut: (resident: ActiveTenantInfo) => void;
  onOpenReactivate: (resident: ActiveTenantInfo) => void;
}

export const ActiveTenantsTab: React.FC<ActiveTenantsTabProps> = ({
  roomNumber,
  residents,
  onOpenCheckIn,
  onOpenEdit,
  onOpenCheckOut,
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (residents.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-heading-main">Kamar {roomNumber} Kosong</h3>
          <p className="text-xs text-gray-secondary-text mt-1 max-w-xs mx-auto">
            Unit ini belum terisi penyewa aktif. Silakan lakukan pendaftaran Check-In penyewa baru.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCheckIn}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-900 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Check-In Penyewa Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Action */}
      <div className="flex items-center justify-between bg-gray-sidebar-hover/40 p-3 rounded-xl border border-gray-border">
        <div className="text-xs font-semibold text-gray-heading-main">
          Penghuni Aktif: <span className="font-bold text-primary">{residents.length} Orang</span>
        </div>
        <button
          type="button"
          onClick={onOpenCheckIn}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>+ Tambah Penyewa Kongsi</span>
        </button>
      </div>

      {/* Resident Cards */}
      <div className="space-y-4">
        {residents.map((r, idx) => (
          <div
            key={r.id}
            className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-4 shadow-sm relative"
          >
            {/* Header / Basic Info */}
            <div className="flex items-start justify-between border-b border-gray-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-heading-main">{r.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.tenantType === "keluarga"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {r.tenantType}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-placeholder mt-0.5">NIK: {r.nik}</p>
              </div>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                r.verificationStatus === "verified"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : r.verificationStatus === "rejected"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {r.verificationStatus === "verified"
                  ? "Verified RT"
                  : r.verificationStatus === "rejected"
                  ? "Ditolak RT"
                  : "Pending RT"}
              </span>
            </div>

            {/* Field Grid Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-secondary-text">
                <Phone className="h-3.5 w-3.5 text-gray-placeholder shrink-0" />
                <span>No HP: <strong className="text-gray-heading-main">{r.phone || "-"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-secondary-text">
                <Calendar className="h-3.5 w-3.5 text-gray-placeholder shrink-0" />
                <span>Check-In: <strong className="text-gray-heading-main">{formatDate(r.checkInDate)}</strong></span>
              </div>
              {r.originAddress && (
                <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-gray-secondary-text">
                  <MapPin className="h-3.5 w-3.5 text-gray-placeholder shrink-0 mt-0.5" />
                  <span>Alamat Asal: <strong className="text-gray-heading-main">{r.originAddress}</strong></span>
                </div>
              )}
              {r.ktpFile && (
                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-secondary-text">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>KTP: </span>
                  <a
                    href={r.ktpFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Lihat Berkas Scan KTP &rarr;
                  </a>
                </div>
              )}
            </div>

            {/* Card Action Buttons */}
            <div className="pt-3 border-t border-gray-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenEdit(r)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-border text-xs font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Data</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCheckOut(r)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-error-20 text-error border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Check-Out</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
