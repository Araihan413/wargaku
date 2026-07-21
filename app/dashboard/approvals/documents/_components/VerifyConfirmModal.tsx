import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface VerifyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectReason?: string) => Promise<void>;
  action: "approve" | "reject" | null;
  title: string;
}

export const VerifyConfirmModal: React.FC<VerifyConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  title,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      Promise.resolve().then(() => {
        if (active) {
          setRejectReason("");
          setIsSubmitting(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen || !action) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === "reject" && !rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(action === "reject" ? rejectReason : undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col z-10 mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border">
          <h3 className="text-sm font-bold text-gray-heading-main">
            {action === "approve" ? "Setujui Dokumen" : "Tolak Dokumen"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm}>
          <div className="p-6 space-y-4">
            {action === "approve" ? (
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-heading-main">
                    Apakah Anda yakin ingin menyetujui dokumen ini?
                  </p>
                  <p className="text-[10px] text-gray-secondary-text mt-1">
                    Dokumen milik <strong>{title}</strong> akan ditandai sebagai Terverifikasi dan data kependudukan mereka akan dikunci.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-heading-main">
                      Tolak dokumen kependudukan?
                    </p>
                    <p className="text-[10px] text-gray-secondary-text mt-1">
                      Berikan alasan penolakan agar warga atau koordinator dapat memahami bagian dokumen yang perlu diperbaiki.
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-secondary-text tracking-wider mb-1.5">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Foto berkas buram / NIK pada Kartu Keluarga tidak cocok dengan data input."
                    className="w-full text-xs px-3 py-2 bg-gray-sidebar-hover/30 border border-gray-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-placeholder resize-none text-gray-heading-main"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-sidebar-hover/10 border-t border-gray-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border text-xs text-gray-secondary-text hover:text-gray-heading-main bg-transparent hover:bg-gray-sidebar-hover rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (action === "reject" && !rejectReason.trim())}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                action === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memproses...
                </>
              ) : action === "approve" ? (
                "Ya, Setujui"
              ) : (
                "Ya, Tolak"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
