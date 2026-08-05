"use client";

import React, { useState } from "react";
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
import { downloadFileAsPdf } from "@/lib/download-pdf-helper";
import { ConfirmModal } from "@/components/ConfirmModal";

interface WargaKKHeaderProps {
  family: WargaFamilyDetail;
  onRefresh: () => void;
}

export const WargaKKHeader: React.FC<WargaKKHeaderProps> = ({ family, onRefresh }) => {
  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [isUploadingKK, setIsUploadingKK] = useState(false);
  const [showKkUploadForm, setShowKkUploadForm] = useState(false);
  const [isCancellingSubmit, setIsCancellingSubmit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [isEditingKKNumber, setIsEditingKKNumber] = useState(false);
  const [kkNumberInput, setKkNumberInput] = useState(family.familyNumber);
  const [isSavingKKNumber, setIsSavingKKNumber] = useState(false);

  const isLocked = family.verificationStatus === "verified" || family.verificationStatus === "pending";

  // Handle edit KK Number
  const handleSaveKKNumber = async () => {
    if (!/^[0-9]{16}$/.test(kkNumberInput)) {
      toast.error("Nomor Kartu Keluarga harus 16 digit angka.");
      return;
    }

    setIsSavingKKNumber(true);
    try {
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
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSavingKKNumber(false);
    }
  };

  // Save KK URL (both Cloudinary or Google Drive) to DB
  const saveKKFileToDB = async (url: string) => {
    setIsUploadingKK(true);
    try {
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
    setIsRequestingChange(true);
    try {
      const res = await fetch(`/api/families/${family.id}/request-change`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Permohonan perubahan data berhasil diajukan. Status KK kembali ke 'draf' dan form dapat diedit.");
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
      const res = await fetch(`/api/families/${family.id}/cancel-submit`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Pengajuan verifikasi berhasil dibatalkan!");
        setShowCancelConfirm(false);
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal membatalkan pengajuan");
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
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-secondary-text">
                Kartu Keluarga Mandiri
              </span>

              {/* Status Badge */}
              {family.verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi RT
                </span>
              )}
              {family.verificationStatus === "pending" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi RT
                </span>
              )}
              {family.verificationStatus === "rejected" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Ditolak RT
                </span>
              )}
              {family.verificationStatus === "draft" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <FileText className="h-3.5 w-3.5" /> Draf (Belum Dikirim)
                </span>
              )}
              {family.verificationStatus === "unsubmitted" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <FileText className="h-3.5 w-3.5" /> Berkas Belum Diunggah
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
                      No. KK: {family.familyNumber}
                    </h2>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setKkNumberInput(family.familyNumber);
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
                <p className="text-xs text-gray-secondary-text mt-1">
                  Alamat Hunian: Blok {family.dwellingAddress.blockNumber} No. {family.dwellingAddress.houseNumber}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons & Scan KK File View */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* KK File Button */}
            {family.kkFile ? (
              <>
                <a
                  href={family.kkFile}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-border bg-gray-sidebar-hover hover:bg-gray-divider px-4 py-2.5 text-xs font-bold text-gray-heading-main transition-colors shadow-sm"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Lihat Scan KK</span>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-placeholder" />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    downloadFileAsPdf(
                      family.kkFile || "",
                      `Scan_KK_${family.familyNumber}`,
                      `KARTU KELUARGA - ${family.headName.toUpperCase()}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Unduh PDF</span>
                </button>
              </>
            ) : null}

            {/* Upload Scan KK Trigger */}
            {!isLocked && (
              <button
                type="button"
                onClick={() => setShowKkUploadForm(!showKkUploadForm)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-900 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>{family.kkFile ? "Ganti Berkas KK" : "Unggah Scan KK"}</span>
              </button>
            )}

            {/* Request Change Button when Verified */}
            {family.verificationStatus === "verified" && (
              <button
                type="button"
                onClick={handleRequestChange}
                disabled={isRequestingChange}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-800 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isRequestingChange ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit3 className="h-4 w-4 text-amber-700" />
                )}
                <span>Ajukan Perubahan Data</span>
              </button>
            )}

            {/* Cancel Verification Button when Pending */}
            {family.verificationStatus === "pending" && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCancellingSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-800 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isCancellingSubmit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-700" />
                )}
                <span>Batalkan Pengajuan</span>
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
        description="Apakah Anda yakin ingin membatalkan pengajuan verifikasi Kartu Keluarga ini? Status KK Anda akan kembali menjadi Draf dan Ketua RT tidak akan menerima permohonan verifikasi ini."
        confirmText="Ya, Batalkan"
        cancelText="Batal"
        isLoading={isCancellingSubmit}
        variant="danger"
      />

      {/* Alert Banners */}
      {family.verificationStatus === "verified" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Data KK Telah Terverifikasi Ketua RT:</span> Seluruh biodata dan berkas keluarga dikunci demi keamanan data. Jika Anda ingin mengubah atau menambahkan anggota keluarga, klik tombol <span className="font-bold text-amber-800">&quot;Ajukan Perubahan Data&quot;</span> di atas.
          </div>
        </div>
      )}

      {family.verificationStatus === "draft" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 shadow-sm">
          <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-blue-800">Status Dokumen: Draf (Belum Dikirim)</span>
            <p className="mt-0.5 text-blue-700 dark:text-blue-300">
              Anda masih dapat mengelola biodata anggota keluarga dan mengunggah berkas scan KK.
              Setelah data dirasa lengkap dan benar, silakan klik tombol <span className="font-bold text-emerald-700">&quot;Kirim ke RT&quot;</span> di atas agar berkas masuk ke antrean verifikasi Ketua RT.
            </p>
          </div>
        </div>
      )}

      {family.verificationStatus === "rejected" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-red-800">Verifikasi Berkas KK Ditolak oleh RT:</p>
            <p className="mt-0.5">{family.verificationNote || "Silakan periksa kembali kelengkapan scan KK dan biodata anggota keluarga Anda."}</p>
          </div>
        </div>
      )}

      {family.verificationStatus === "pending" && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 shadow-sm">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Berkas Sedang Ditinjau RT:</span> Permohonan atau pembaruan berkas KK Anda saat ini sedang ditinjau oleh Ketua RT.
          </div>
        </div>
      )}
    </div>
  );
};
