import React, { useState } from "react";
import { X, Loader2, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { RentalResidentItem } from "./RentalTable";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface VerifyTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

export const VerifyTenantModal: React.FC<VerifyTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!resident) return;

    if (status === "rejected" && !rejectNote.trim()) {
      toast.error("Catatan penolakan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/rental-residents/${resident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: status,
          verificationNote: status === "rejected" ? rejectNote : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal memperbarui status verifikasi");
      }

      toast.success(
        status === "verified"
          ? "Dokumen penyewa berhasil diverifikasi dan disetujui"
          : "Pendaftaran dokumen penyewa telah ditolak"
      );
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRejectNote("");
    setShowRejectForm(false);
    onClose();
  };

  if (!isOpen || !resident) return null;

  const addressStr = `Blok ${resident.blockNumber} No. ${resident.houseNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Verifikasi Dokumen Penyewa</h3>
              <p className="text-[10px] text-gray-secondary-text">Tinjau kesesuaian berkas identitas penyewa</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Profile Overview */}
          <div className="bg-gray-sidebar-hover/20 p-4 border border-gray-border rounded-xl space-y-2">
            <div className="text-xs text-gray-placeholder font-bold uppercase tracking-wider">Profil Penyewa</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-secondary-text block">Nama Lengkap</span>
                <span className="font-semibold text-gray-heading-main block mt-0.5">{resident.name}</span>
              </div>
              <div>
                <span className="text-gray-secondary-text block">NIK (Nomor KTP)</span>
                <span className="font-mono text-gray-heading-main block mt-0.5">{resident.nik}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-secondary-text block">Alamat Tinggal RT (Properti)</span>
                <span className="font-semibold text-gray-heading-main block mt-0.5">
                  {resident.propertyName} - {addressStr} {resident.roomNumber ? `(Kamar ${resident.roomNumber})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* KTP Document Simulation */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Dokumen KTP yang Diunggah
            </label>
            {(() => {
              const getFilenameFromUrl = (url: string) => {
                try {
                  const decodedUrl = decodeURIComponent(url);
                  const parts = decodedUrl.split("/");
                  const lastPart = parts[parts.length - 1];
                  if (lastPart) {
                    return lastPart.split("?")[0];
                  }
                  return "Scan_KTP.pdf";
                } catch {
                  return "Scan_KTP.pdf";
                }
              };

              return (
                <div className="border border-gray-border rounded-xl p-4 bg-gray-sidebar-hover/10 flex flex-col items-center justify-center gap-3 min-h-36">
                  <FileText className="h-10 w-10 text-gray-placeholder" />
                  <div className="text-center">
                    <span className="text-xs text-gray-heading-main font-semibold block">
                      {resident.ktpFile ? getFilenameFromUrl(resident.ktpFile) : "Belum diunggah"}
                    </span>
                    <span className="text-[10px] text-gray-placeholder mt-0.5 block">Dokumen KTP Utama</span>
                  </div>
                  {resident.ktpFile && (
                    <SecureDocumentLink
                      type="ktp-tenant"
                      recordId={resident.id}
                      mode="view"
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Lihat Berkas KTP
                    </SecureDocumentLink>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Conditional Reject Form */}
          {showRejectForm && (
            <div className="space-y-1.5 p-4 border border-rose-200 bg-rose-50/50 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="rejectNote" className="block text-sm font-semibold text-rose-800 mb-1.5">
                Alasan Penolakan Dokumen <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                id="rejectNote"
                placeholder="Contoh: Foto KTP buram, NIK tidak terbaca dengan jelas, atau NIK tidak sesuai dengan database dukcapil."
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full text-sm bg-white border border-rose-300 rounded-xl px-3.5 py-2.5 placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-border px-6 py-4 shrink-0">
          <div>
            {showRejectForm && (
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 hover:bg-gray-sidebar-hover rounded-xl text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors"
              >
                Kembali
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!showRejectForm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify("verified")}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Setujui & Verifikasi"
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleVerify("rejected")}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Kirim Penolakan"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
