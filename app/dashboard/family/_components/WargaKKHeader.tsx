"use client";

import React, { useState } from "react";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";
import { WargaFamilyDetail } from "../types";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Edit3,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Download,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { FileUploadModal } from "@/components/FileUploadModal";
import { ConfirmModal } from "@/components/ConfirmModal";

interface WargaKKHeaderProps {
  family: WargaFamilyDetail;
  isLocked: boolean;
  onRefresh: () => void;
  onRequestChange?: () => void;
  onCancelChange?: () => void;
}

export const WargaKKHeader: React.FC<WargaKKHeaderProps> = ({
  family,
  isLocked,
  onRefresh,
  onRequestChange,
  onCancelChange,
}) => {
  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [isUploadingKK, setIsUploadingKK] = useState(false);
  const [showKkUploadForm, setShowKkUploadForm] = useState(false);
  const [isCancellingSubmit, setIsCancellingSubmit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [isEditingKKNumber, setIsEditingKKNumber] = useState(false);
  const [kkNumberInput, setKkNumberInput] = useState(family.familyNumber);
  const [isSavingKKNumber, setIsSavingKKNumber] = useState(false);

  const activeChangeReq = family.changeRequest;
  const isChangeDraftActive = activeChangeReq && (activeChangeReq.status === "draft" || activeChangeReq.status === "rejected");
  const isChangePending = activeChangeReq && activeChangeReq.status === "pending";

  // Handle edit KK Number
  const handleSaveKKNumber = async () => {
    if (!/^[0-9]{16}$/.test(kkNumberInput)) {
      toast.error("Nomor Kartu Keluarga harus 16 digit angka.");
      return;
    }

    setIsSavingKKNumber(true);
    try {
      if (isChangeDraftActive && activeChangeReq) {
        // Save to change request draft
        const res = await fetch(`/api/families/${family.id}/change-request`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyNumber: kkNumberInput,
            kkFile: activeChangeReq.kkFile,
            members: activeChangeReq.draftData.members,
          }),
        });

        if (res.ok) {
          toast.success("Nomor Kartu Keluarga pada draf berhasil diperbarui!");
          setIsEditingKKNumber(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal memperbarui Nomor KK");
        }
      } else {
        const res = await fetch(`/api/families/${family.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyNumber: kkNumberInput }),
        });

        if (res.ok) {
          toast.success("Nomor Kartu Keluarga berhasil diperbarui!");
          setIsEditingKKNumber(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal memperbarui Nomor KK");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSavingKKNumber(false);
    }
  };

  // Save KK URL to DB
  const saveKKFileToDB = async (url: string) => {
    setIsUploadingKK(true);
    try {
      if (isChangeDraftActive && activeChangeReq) {
        const res = await fetch(`/api/families/${family.id}/change-request`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyNumber: activeChangeReq.familyNumber || family.familyNumber,
            kkFile: url,
            members: activeChangeReq.draftData.members,
          }),
        });

        if (res.ok) {
          toast.success("Berkas Scan KK pada draf berhasil disimpan!");
          setShowKkUploadForm(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal menyimpan berkas Scan KK");
        }
      } else {
        const res = await fetch(`/api/families/${family.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kkFile: url }),
        });

        if (res.ok) {
          toast.success("Berkas Scan KK berhasil disimpan!");
          setShowKkUploadForm(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal menyimpan berkas Scan KK");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingKK(false);
    }
  };

  // Upload local file to Cloudinary & Save
  const handleSelectLocalFile = async (file: File) => {
    setIsUploadingKK(true);
    try {
      const res = await uploadFileToCloudinary(file, "kk");
      await saveKKFileToDB(res.url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingKK(false);
    }
  };

  // Request change handler
  const handleRequestChange = async () => {
    if (onRequestChange) {
      onRequestChange();
      return;
    }
    setIsRequestingChange(true);
    try {
      const res = await fetch(`/api/families/${family.id}/change-request`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Draf permohonan perubahan data berhasil dibuka!");
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengajukan perubahan data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi sistem.");
    } finally {
      setIsRequestingChange(false);
    }
  };

  // Cancel verification submit handler
  const handleCancelSubmit = async () => {
    setIsCancellingSubmit(true);
    try {
      if (isChangePending) {
        const res = await fetch(`/api/families/${family.id}/change-request`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Permohonan perubahan data berhasil dibatalkan!");
          setShowCancelConfirm(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal membatalkan permohonan");
        }
      } else {
        const res = await fetch(`/api/families/${family.id}/submit`, {
          method: "DELETE",
        });

        if (res.ok) {
          toast.success("Pengajuan verifikasi berhasil dibatalkan!");
          setShowCancelConfirm(false);
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal membatalkan pengajuan");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi sistem.");
    } finally {
      setIsCancellingSubmit(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Container */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-5">
        {/* BARIS 1: Identitas KK & Aksi Status Utama */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Sisi Kiri: Label, Status, No KK, Kepala Keluarga */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-secondary-text">
                Kartu Keluarga Mandiri
              </span>

              {/* Status Badge */}
              {isChangeDraftActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  <Edit3 className="h-3.5 w-3.5" /> Mode Draf Perubahan Data
                </span>
              )}
              {isChangePending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  <Clock className="h-3.5 w-3.5" /> Perubahan Menunggu Verifikasi RT
                </span>
              )}
              {!activeChangeReq && family.verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi RT
                </span>
              )}
              {!activeChangeReq && family.verificationStatus === "pending" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi RT
                </span>
              )}
              {!activeChangeReq && family.verificationStatus === "rejected" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> Ditolak RT
                </span>
              )}
              {!activeChangeReq && family.verificationStatus === "draft" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  <FileText className="h-3.5 w-3.5" /> Draf Registrasi Awal
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {isEditingKKNumber ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      maxLength={16}
                      value={kkNumberInput}
                      onChange={(e) => setKkNumberInput(e.target.value.replace(/\D/g, ""))}
                      className="w-56 bg-gray-card border border-gray-border rounded-xl px-3.5 py-1.5 text-base font-bold text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="16 Digit Nomor KK"
                    />
                    <button
                      type="button"
                      onClick={handleSaveKKNumber}
                      disabled={isSavingKKNumber}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingKKNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingKKNumber(false);
                        setKkNumberInput(family.familyNumber);
                      }}
                      className="rounded-xl border border-gray-border bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-gray-heading-main tracking-tight">
                      No. KK: {isChangeDraftActive && activeChangeReq?.familyNumber ? activeChangeReq.familyNumber : family.familyNumber}
                    </h2>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setKkNumberInput(isChangeDraftActive && activeChangeReq?.familyNumber ? activeChangeReq.familyNumber : family.familyNumber);
                          setIsEditingKKNumber(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-border bg-gray-card hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main px-2 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        title="Edit Nomor KK"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-heading-main mt-1">
                Kepala Keluarga: <span className="text-primary-900 font-bold">{family.headName}</span>
              </p>
              {family.dwellingAddress && (
                <p className="text-xs text-gray-secondary-text mt-0.5">
                  Alamat Hunian: Blok {family.dwellingAddress.blockNumber} No. {family.dwellingAddress.houseNumber}
                </p>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Aksi Status Alur (Ajukan Perubahan / Batalkan Draf / Batalkan Pengajuan) */}
          <div className="flex items-center gap-2 self-start shrink-0">
            {/* Request Change Button when Verified & no active change request */}
            {!activeChangeReq && family.verificationStatus === "verified" && (
              <button
                type="button"
                onClick={handleRequestChange}
                disabled={isRequestingChange}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-800 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isRequestingChange ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit3 className="h-4 w-4 text-amber-700" />
                )}
                <span>Ajukan Perubahan Data</span>
              </button>
            )}

            {/* Cancel Change Draft Button */}
            {isChangeDraftActive && onCancelChange && (
              <button
                type="button"
                onClick={onCancelChange}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 px-3.5 py-2 text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Batalkan Draf Perubahan</span>
              </button>
            )}

            {/* Cancel Verification Button when Pending (Initial or Change) */}
            {(isChangePending || (!activeChangeReq && family.verificationStatus === "pending")) && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCancellingSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 px-3.5 py-2 text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isCancellingSubmit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Batalkan Pengajuan</span>
              </button>
            )}
          </div>
        </div>

        {/* BARIS 2: Bar Berkas Dokumen Scan KK */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3.5 border-t border-gray-border/60">
          {/* Status Berkas */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
              family.kkFile ? "bg-emerald-100 text-emerald-700" : "bg-gray-sidebar-hover text-gray-placeholder"
            }`}>
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-gray-heading-main block">
                {family.kkFile ? "Berkas Scan Kartu Keluarga" : "Berkas Scan KK Belum Diunggah"}
              </span>
              <span className="text-[11px] text-gray-secondary-text block">
                {family.kkFile ? "Tersimpan aman & terverifikasi" : "Unggah scan KK format PDF / Gambar"}
              </span>
            </div>
          </div>

          {/* Tombol Aksi Berkas KK */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
            {family.kkFile && (
              <>
                <SecureDocumentLink
                  type="kk"
                  recordId={family.id}
                  mode="view"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-border bg-gray-card hover:bg-gray-sidebar-hover px-3 py-1.5 text-xs font-semibold text-gray-heading-main transition-colors shadow-xs cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Lihat Scan</span>
                  <ExternalLink className="h-3 w-3 text-gray-placeholder" />
                </SecureDocumentLink>

                <SecureDocumentLink
                  type="kk"
                  recordId={family.id}
                  mode="download"
                  downloadFilename={`Scan_KK_${family.familyNumber}.pdf`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Unduh PDF</span>
                </SecureDocumentLink>
              </>
            )}

            {/* Upload / Ganti Berkas KK */}
            {!isLocked && (
              <button
                type="button"
                onClick={() => setShowKkUploadForm(!showKkUploadForm)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-900 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{family.kkFile ? "Ganti Berkas" : "Unggah Scan KK"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up Modal Upload Berkas KK */}
      <FileUploadModal
        isOpen={showKkUploadForm && !isLocked}
        onClose={() => setShowKkUploadForm(false)}
        title="Unggah Berkas Scan KK"
        description="Pilih apakah Anda ingin mengunggah berkas scan KK dari perangkat Anda atau menggunakan Google Drive."
        onSelectLocalFile={handleSelectLocalFile}
        isLoading={isUploadingKK}
      />

      {/* Confirm Modal Cancel Verification */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubmit}
        title="Batalkan Pengajuan Verifikasi"
        description="Apakah Anda yakin ingin membatalkan pengajuan verifikasi Kartu Keluarga ini? Status KK Anda akan dikembalikan dan Ketua RT tidak akan memproses pengajuan ini."
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isLoading={isCancellingSubmit}
        variant="danger"
      />

      {/* Alert Banners */}
      {isChangeDraftActive && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
          <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-800">Mode Draf Perubahan Data Aktif:</span>
            <p className="mt-0.5 text-amber-700">
              Anda sedang menyusun usulan perubahan data keluarga. Data resmi Anda di RT tetap aman dan tidak akan berubah sampai Anda mengirimkan dan disetujui oleh RT.
              {activeChangeReq?.status === "rejected" && activeChangeReq.rejectionNote && (
                <span className="block mt-1 font-bold text-red-700">
                  Catatan Penolakan Sebelumnya: &ldquo;{activeChangeReq.rejectionNote}&rdquo;
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {isChangePending && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 shadow-sm">
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-blue-800">Usulan Perubahan Sedang Ditinjau RT:</span> Permohonan perubahan data Kartu Keluarga Anda telah dikirim dan sedang menunggu verifikasi oleh Pengurus RT.
          </div>
        </div>
      )}

      {!activeChangeReq && family.verificationStatus === "verified" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Data KK Telah Terverifikasi Ketua RT:</span> Seluruh biodata dan berkas keluarga dikunci demi keamanan data. Jika Anda ingin mengubah atau menambahkan anggota keluarga, klik tombol <span className="font-bold text-amber-800">&quot;Ajukan Perubahan Data&quot;</span> di atas.
          </div>
        </div>
      )}

      {!activeChangeReq && family.verificationStatus === "rejected" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed flex-1">
            <span className="font-bold text-red-800 text-sm">Pengajuan Berkas Kartu Keluarga Ditolak RT</span>
            {family.verificationNote ? (
              <div className="mt-1.5 p-3 rounded-xl bg-red-100/80 border border-red-200 text-red-900 font-medium">
                <span className="font-bold text-red-800 block mb-0.5">Catatan / Alasan Penolakan:</span>
                &ldquo;{family.verificationNote}&rdquo;
              </div>
            ) : (
              <p className="mt-1 text-red-700">
                Pengajuan Kartu Keluarga Anda ditolak oleh Pengurus RT. Silakan periksa kembali kelengkapan data atau berkas scan KK Anda.
              </p>
            )}
            <p className="mt-2 text-red-600 font-medium">
              Silakan perbaiki data atau unggah ulang berkas scan KK yang sesuai, lalu tekan tombol <span className="font-bold text-emerald-700">&quot;Ajukan Ulang ke RT&quot;</span> di bagian bawah halaman.
            </p>
          </div>
        </div>
      )}

      {!activeChangeReq && family.verificationStatus === "draft" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 shadow-sm">
          <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-blue-800">Status Dokumen: Draf Registrasi Awal</span>
            <p className="mt-0.5 text-blue-700">
              Anda masih dapat mengelola biodata anggota keluarga dan mengunggah berkas scan KK.
              Setelah data lengkap dan benar, silakan klik tombol <span className="font-bold text-emerald-700">&quot;Verifikasi Ke RT&quot;</span> di bagian bawah halaman.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
