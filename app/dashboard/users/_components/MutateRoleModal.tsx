import React, { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserItem, RoleItem } from "../types";
import { CustomSelect } from "@/components/CustomSelect";

interface MutateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  roles: RoleItem[];
  onSuccess: () => void;
}

export const MutateRoleModal: React.FC<MutateRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  roles,
  onSuccess,
}) => {
  const [targetRoleId, setTargetRoleId] = useState<number | "">(user?.roleId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleMutateRole = async () => {
    if (!user || !targetRoleId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mutate_role",
          payload: { roleId: targetRoleId },
        }),
      });

      if (res.ok) {
        toast.success(`Peran ${user.name} berhasil dimutasi`);
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal memutasi peran");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-heading-main">
            Mutasi Peran Pengguna
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs text-primary-900 leading-relaxed flex gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <span className="font-bold">Informasi:</span> Mengubah wewenang/hak
              akses dashboard pengguna tidak akan memengaruhi data kependudukan
              mereka pada database keluarga (KK).
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
            <span className="block text-xs font-semibold text-gray-secondary-text uppercase tracking-wider mb-1">
              Peran Saat Ini
            </span>
            <span className="inline-flex rounded-lg bg-primary-900-20 px-2.5 py-1 text-xs font-bold text-primary-900 border border-primary/10">
              {user.roleName}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider mb-2">
              Pilih Peran Baru
            </label>
            <CustomSelect
              value={targetRoleId.toString()}
              onChange={(val) => setTargetRoleId(val ? parseInt(val, 10) : "")}
              options={roles.map((r) => ({
                value: r.id.toString(),
                label: r.name,
              }))}
              placeholder="Pilih Peran Baru"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-border pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-border px-4 py-2 text-sm font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleMutateRole}
              disabled={
                isSubmitting ||
                !targetRoleId ||
                targetRoleId === user.roleId
              }
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-900 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Simpan Peran Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
