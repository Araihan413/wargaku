"use client";

import React from "react";
import { X, Calendar, User, Phone, MapPin, FileText, Download } from "lucide-react";
import { RentalResidentItem } from "../types";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface DetailResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: RentalResidentItem | null;
}

export const DetailResidentModal: React.FC<DetailResidentModalProps> = ({
  isOpen,
  onClose,
  resident,
}) => {
  if (!isOpen || !resident) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Rincian Data Penyewa
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Status Badge & Tenant Type */}
          <div className="flex items-center justify-between bg-gray-sidebar-hover/30 border border-gray-border rounded-xl p-3">
            <div>
              <span className="text-[10px] font-semibold text-gray-secondary-text block">Tipe Penyewa</span>
              <span className="text-sm font-bold text-primary capitalize">{resident.tenantType || "Perorangan"}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-gray-secondary-text block mb-1">Status Verifikasi</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                resident.verificationStatus === "verified"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : resident.verificationStatus === "rejected"
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {resident.verificationStatus === "verified" ? "Terverifikasi" : resident.verificationStatus === "rejected" ? "Ditolak RT" : "Menunggu Review"}
              </span>
            </div>
          </div>

          {/* Reject Note if any */}
          {resident.verificationStatus === "rejected" && resident.verificationNote && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 block uppercase tracking-wider">Catatan Penolakan RT:</span>
              <p className="text-xs text-rose-600 mt-1 italic">&ldquo;{resident.verificationNote}&rdquo;</p>
            </div>
          )}

          {/* Section 1: Profil */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider border-b border-gray-border pb-1">
              Profil Penyewa
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex gap-2.5 items-start">
                <User className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-secondary-text block">Nama Lengkap</span>
                  <span className="text-sm font-semibold text-gray-heading-main">{resident.name}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <FileText className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-secondary-text block">NIK / No. Identitas</span>
                  <span className="text-sm font-semibold font-mono text-gray-heading-main">{resident.nik}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <Phone className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-secondary-text block">No. HP / WA</span>
                  <span className="text-sm font-semibold text-gray-heading-main">{resident.phone || "-"}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <Calendar className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-secondary-text block">Tanggal Masuk (Check-In)</span>
                  <span className="text-sm font-semibold text-gray-heading-main">{formatDate(resident.checkInDate)}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <MapPin className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-secondary-text block">Status Asal KTP</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold mt-0.5 ${
                    resident.isKtpSameVillage
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {resident.isKtpSameVillage ? "Warga Lokal (Satu Kelurahan)" : "Warga Pendatang (Luar Kelurahan)"}
                  </span>
                </div>
              </div>

              {resident.ktpAddress && (
                <div className="flex gap-2.5 items-start sm:col-span-2">
                  <MapPin className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-secondary-text block">Alamat KTP</span>
                    <span className="text-sm font-semibold text-gray-heading-main">{resident.ktpAddress}</span>
                  </div>
                </div>
              )}

              {resident.checkOutDate && (
                <div className="flex gap-2.5 items-start">
                  <Calendar className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-secondary-text block">Tanggal Keluar (Check-Out)</span>
                    <span className="text-sm font-semibold text-rose-600">{formatDate(resident.checkOutDate)}</span>
                  </div>
                </div>
              )}

              {resident.checkOutNote && (
                <div className="flex gap-2.5 items-start sm:col-span-2">
                  <FileText className="h-4.5 w-4.5 text-gray-placeholder shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-secondary-text block">Catatan Check-Out</span>
                    <span className="text-sm font-semibold text-gray-heading-main italic">&ldquo;{resident.checkOutNote}&rdquo;</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Berkas KTP */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider border-b border-gray-border pb-1">
              Berkas Identitas (KTP)
            </h4>
            
            {resident.ktpFile ? (() => {
              const getFilenameFromUrl = (url: string) => {
                try {
                  const decodedUrl = decodeURIComponent(url);
                  const parts = decodedUrl.split("/");
                  const lastPart = parts[parts.length - 1];
                  if (lastPart) {
                    return lastPart.split("?")[0];
                  }
                  return `Scan_KTP_${resident.nik}.pdf`;
                } catch {
                  return `Scan_KTP_${resident.nik}.pdf`;
                }
              };

              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-sidebar-hover/20 border border-gray-border rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="truncate max-w-60">
                      <span className="text-xs font-bold text-gray-heading-main block truncate">
                        {getFilenameFromUrl(resident.ktpFile)}
                      </span>
                      <span className="text-[10px] text-gray-placeholder">Berkas KTP Penyewa Terunggah</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <SecureDocumentLink
                      type="ktp-tenant"
                      recordId={resident.id}
                      mode="view"
                      className="flex-1 sm:flex-initial text-center px-3 py-1.5 border border-gray-border bg-white hover:bg-gray-sidebar-hover text-gray-heading-main rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Lihat KTP
                    </SecureDocumentLink>
                    <SecureDocumentLink
                      type="ktp-tenant"
                      recordId={resident.id}
                      mode="download"
                      downloadFilename={`Scan_KTP_${resident.nik}.pdf`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </SecureDocumentLink>
                  </div>
                </div>
              );
            })() : (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                <span className="text-xs text-amber-700 font-semibold block">Berkas KTP belum diunggah</span>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Koordinator belum mengunggah foto/scan berkas KTP penyewa ini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-sidebar-hover text-gray-heading-main hover:bg-gray-sidebar-hover-dark border border-gray-border rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
};
