import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FamilyMemberItem } from "../../../types";

interface NonaktifkanAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: FamilyMemberItem | null;
}

export const NonaktifkanAnggotaModal: React.FC<NonaktifkanAnggotaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
  const [inactiveNote, setInactiveNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setInactiveNote("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!member) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/family-members/${member.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inactiveNote }),
      });

      if (res.ok) {
        toast.success(`Anggota keluarga "${member.name}" berhasil dinonaktifkan`);
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menonaktifkan anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !member) return null;

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 text-error shrink-0">
          <div className="p-2 bg-error/10 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-heading-main">
            Nonaktifkan Anggota Keluarga
          </h3>
        </div>

        {/* Form Body */}
        <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-secondary-text leading-relaxed">
            Apakah Anda yakin ingin menonaktifkan status kependudukan warga bernama{" "}
            <strong className="text-gray-heading-main font-semibold">
              {member.name}
            </strong>{" "}?
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider block">
              Catatan Penonaktifan
            </label>
            <textarea
              value={inactiveNote}
              onChange={(e) => setInactiveNote(e.target.value)}
              placeholder="Contoh: Pindah ke luar kota, dll (opsional)"
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="p-3.5 bg-error/5 border border-error/20 rounded-xl text-xs text-error font-semibold leading-relaxed">
            Peringatan: Setelah dinonaktifkan, warga tidak akan terhitung lagi dalam statistik kependudukan aktif dan peran mereka di Kartu Keluarga akan diarsipkan.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Proses...
              </>
            ) : (
              "Ya, Nonaktifkan Warga"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
