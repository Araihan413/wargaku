import React from "react";
import { X, User, Phone, MapPin, Calendar, Briefcase, FileText, AlertTriangle, GraduationCap, Download, Eye } from "lucide-react";
import { RentalResidentItem } from "./RentalTable";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: RentalResidentItem | null;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  isOpen,
  onClose,
  resident,
}) => {

  if (!isOpen || !resident) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getFilenameFromUrl = (url: string) => {
    if (url.includes("drive.google.com") || url.includes("google.com/file")) {
      return "Dokumen Google Drive";
    }
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        return lastPart.split("?")[0];
      }
      return "Berkas KTP";
    } catch {
      return "Berkas KTP";
    }
  };

  const addressStr = `Blok ${resident.blockNumber} No. ${resident.houseNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Profil & Detail Penyewa</h3>
              <p className="text-[10px] text-gray-secondary-text">Rincian data kependudukan penghuni sewa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Top Banner Status */}
          <div className="flex items-center justify-between border border-gray-border bg-gray-sidebar-hover/10 rounded-xl p-4">
            <div className="space-y-1">
              <div className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider">Status Hunian</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                resident.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {resident.isActive ? "Aktif Huni" : "Sudah Check-Out"}
              </span>
            </div>

            <div className="space-y-1 text-right">
              <div className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider">Status Dokumen</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                resident.verificationStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : resident.verificationStatus === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {resident.verificationStatus === 'verified' ? 'Terverifikasi' : resident.verificationStatus === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
              </span>
            </div>
          </div>

          {/* Verification Notes Alert (If Rejected or Note Exists) */}
          {resident.verificationStatus === 'rejected' && (
            <div className="flex gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 leading-relaxed font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="block font-bold">Catatan Penolakan RT:</span>
                <span className="block font-normal mt-0.5">{resident.verificationNote || "Tidak ada catatan spesifik."}</span>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-3">
            <div className="text-xs text-gray-placeholder font-bold uppercase tracking-wider">Biodata Diri</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3 items-start">
                <User className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Nama Lengkap</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.name}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <FileText className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">NIK (KTP)</span>
                  <span className="text-xs font-mono font-semibold text-gray-heading-main">{resident.nik}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Phone className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Nomor HP / WhatsApp</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.phone || "-"}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <GraduationCap className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Pendidikan</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.educationLevel || "-"}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Briefcase className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Pekerjaan</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.occupation || "-"}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Calendar className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Agama</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.religion || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-border" />

          {/* Rental Properties Info */}
          <div className="space-y-3">
            <div className="text-xs text-gray-placeholder font-bold uppercase tracking-wider">Informasi Kontrak / Sewa</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3 items-start">
                <MapPin className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Nama Properti & Alamat</span>
                  <span className="text-xs font-semibold text-gray-heading-main block">{resident.propertyName}</span>
                  <span className="text-[10px] text-gray-secondary-text mt-0.5 block">{addressStr}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <FileText className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Nomor Kamar</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{resident.roomNumber || "Unit Utama"}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Calendar className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Tanggal Masuk</span>
                  <span className="text-xs font-semibold text-gray-heading-main">{formatDate(resident.checkInDate)}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Calendar className="h-5 w-5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-placeholder block font-bold uppercase tracking-wider">Tanggal Keluar</span>
                  <span className={`text-xs font-semibold ${resident.checkOutDate ? "text-red-600" : "text-gray-heading-main"}`}>
                    {resident.checkOutDate ? formatDate(resident.checkOutDate) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-border" />

          {/* Origin Address */}
          <div className="space-y-2">
            <span className="text-xs text-gray-placeholder block font-bold uppercase tracking-wider">Alamat Asal</span>
            <div className="text-xs text-gray-heading-main bg-gray-sidebar-hover/10 p-3 rounded-xl border border-gray-border leading-relaxed">
              {resident.originAddress || "-"}
            </div>
          </div>

          {/* KTP Document Link */}
          <div className="space-y-2.5">
            <span className="text-xs text-gray-placeholder block font-bold uppercase tracking-wider">Berkas Scan KTP</span>
            {resident.ktpFile ? (
              <div className="border border-gray-border rounded-2xl overflow-hidden bg-gray-card/50 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3 p-3 bg-gray-sidebar-hover/10 rounded-xl border border-gray-border">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-heading-main block truncate">
                      Dokumen Scan KTP
                    </span>
                    <span className="text-[10px] text-gray-secondary-text block truncate mt-0.5">
                      {getFilenameFromUrl(resident.ktpFile)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <SecureDocumentLink
                    type="ktp-tenant"
                    recordId={resident.id}
                    mode="view"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="h-4 w-4 text-gray-secondary-text" />
                    Lihat KTP
                  </SecureDocumentLink>
                  <SecureDocumentLink
                    type="ktp-tenant"
                    recordId={resident.id}
                    mode="download"
                    downloadFilename={`KTP_${resident.name.replace(/\s+/g, "_")}.pdf`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm px-4 py-2"
                  >
                    <Download className="h-4 w-4" />
                    Unduh KTP
                  </SecureDocumentLink>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-semibold leading-relaxed shadow-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <span className="block font-bold">Berkas KTP Belum Diunggah</span>
                  <span className="block font-normal text-[10px] text-amber-600/90 mt-0.5">
                    Penyewa ini belum memiliki berkas scan KTP terunggah di dalam sistem.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-border px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-xs font-semibold text-gray-heading-main cursor-pointer transition-all"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};
