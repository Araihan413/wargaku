import React, { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserItem } from "../types";

interface MutateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onSuccess: () => void;
}

export const MutateRoleModal: React.FC<MutateRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {

  // Determine current active officer role for target user (2, 3, or 4)
  const currentOfficerRoleId =
    user?.roleIds?.find((id) => [2, 3, 4].includes(id)) ??
    ([2, 3, 4].includes(user?.roleId || 0) ? user?.roleId : null);

  const [selectedOfficerRoleId, setSelectedOfficerRoleId] = useState<number | null>(
    () => currentOfficerRoleId ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevUserId, setPrevUserId] = useState<string | null>(user?.id || null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    const activeOffRole =
      user.roleIds?.find((id) => [2, 3, 4].includes(id)) ??
      ([2, 3, 4].includes(user.roleId) ? user.roleId : null);
    setSelectedOfficerRoleId(activeOffRole ?? null);
  }

  const handleMutateOfficer = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mutate_role",
          payload: { officerRoleId: selectedOfficerRoleId },
        }),
      });

      if (res.ok) {
        toast.success(`Jabatan Pengurus ${user.name} berhasil diperbarui`);
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal memutasi jabatan pengurus");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  const officerOptions = [
    {
      id: 2,
      name: "Ketua RT",
      description: "Penanggung jawab utama dan pengambil keputusan tertinggi wilayah RT",
    },
    {
      id: 3,
      name: "Sekretaris RT",
      description: "Pengelola administrasi, verifikasi dokumen KK, dan keartisan RT",
    },
    {
      id: 4,
      name: "Bendahara RT",
      description: "Pengelola keuangan, transparansi kas, dan laporan tagihan iuran RT",
    },
    {
      id: null,
      name: "Purna Tugas / Non-Pengurus",
      description: "Mencabut jabatan pengurus. User kembali ke mode Warga biasa / Idle",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden p-0">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border p-5 shrink-0 bg-gray-card z-10">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Mutasi Jabatan Pengurus RT
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs text-primary-900 leading-relaxed flex gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <span className="font-bold">Informasi Jabatan Dinas:</span> Fitur ini digunakan untuk penunjukan atau pergantian Pengurus RT. Setiap pengguna hanya dapat memegang maksimal **1 Jabatan Pengurus RT**.
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-secondary-text uppercase tracking-wider mb-1">
              Nama Pengguna
            </span>
            <span className="text-sm font-bold text-gray-heading-main">
              {user.name}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider mb-2">
              Pilih Jabatan Pengurus RT
            </label>
            <div className="space-y-2 border border-gray-border rounded-xl p-3 bg-gray-sidebar-hover/30">
              {officerOptions.map((opt) => {
                const isSelected = selectedOfficerRoleId === opt.id;
                return (
                  <label
                    key={opt.id ?? "purna"}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-gray-border bg-gray-card hover:bg-gray-sidebar-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="officerRole"
                      checked={isSelected}
                      onChange={() => setSelectedOfficerRoleId(opt.id)}
                      className="mt-0.5 border-gray-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="text-xs flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold block ${isSelected ? "text-primary" : "text-gray-heading-main"}`}>
                          {opt.name}
                        </span>
                        {isSelected && opt.id !== null && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            Terpilih
                          </span>
                        )}
                        {isSelected && opt.id === null && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                            Purna Tugas
                          </span>
                        )}
                      </div>
                      <span className="text-gray-secondary-text text-[11px] block mt-1 leading-relaxed">
                        {opt.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Actions Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-border p-4 bg-gray-card shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-border px-4 py-2 text-sm font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleMutateOfficer}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-900 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Simpan Jabatan</span>
          </button>
        </div>
      </div>
    </div>
  );
};



