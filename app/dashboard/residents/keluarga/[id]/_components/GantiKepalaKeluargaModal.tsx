import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ShieldAlert, Mail, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { changeFamilyHeadSchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface GantiKepalaKeluargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyId: number;
  members: any[];
  currentHeadName: string;
}

export const GantiKepalaKeluargaModal: React.FC<GantiKepalaKeluargaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyId,
  members,
  currentHeadName,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeFamilyHeadSchema),
    defaultValues: {
      newHeadMemberId: undefined as any,
      oldHeadAction: "none" as any,
      newHeadEmail: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        newHeadMemberId: Number(data.newHeadMemberId),
        oldHeadAction: data.oldHeadAction,
        newHeadEmail: data.newHeadEmail || null,
      };

      const res = await fetch(`/api/families/${familyId}/change-head`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Kepala Keluarga berhasil diubah.");
        reset();
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengubah Kepala Keluarga.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat memproses perubahan Kepala Keluarga.");
    }
  };

  if (!isOpen) return null;

  // Filter members to only show non-head members (can't select current head)
  const candidateMembers = members.filter(
    (m) => m.relationship !== "Kepala_Keluarga" && m.isActive
  );

  const memberOptions: SelectOption[] = candidateMembers.map((m) => ({
    value: m.id.toString(),
    label: `${m.name} (${m.relationship}) - NIK: ${m.nik}`,
  }));

  const actionOptions: SelectOption[] = [
    { value: "none", label: "Tetap Tinggal di KK Ini (Turun Jabatan Menjadi Anggota)" },
    { value: "pindah", label: "Pindah KK / Keluar Wilayah RT (Pindah)" },
    { value: "suspend", label: "Dinonaktifkan Secara Absolut (Meninggal Dunia)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-heading-main">
              Ganti Kepala Keluarga
            </h3>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Ubah jabatan kepala keluarga pada KK ini.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="bg-error/5 border border-error/20 rounded-2xl p-4 flex gap-3 text-xs text-error leading-relaxed font-semibold mb-4">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p>
            <strong>Pemberitahuan Keamanan:</strong> Mengganti Kepala Keluarga akan mereset status verifikasi KK menjadi <strong>Pending</strong>.
            Akses login Kepala Keluarga lama ({currentHeadName}) akan dicabut atau disesuaikan berdasarkan pilihan tindakan di bawah.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* New Head Selection */}
            <div className="space-y-1.5">
              {memberOptions.length === 0 ? (
                <div className="p-3 bg-gray-sidebar-hover border border-gray-border rounded-xl text-xs text-gray-secondary-text text-center">
                  Tidak ada anggota keluarga lain yang aktif untuk dijadikan Kepala Keluarga.
                </div>
              ) : (
                <Controller
                  name="newHeadMemberId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        label="Pilih Kepala Keluarga Baru"
                        required={true}
                        value={field.value ? field.value.toString() : ""}
                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                        options={memberOptions}
                        placeholder="-- Pilih Anggota Keluarga --"
                      />
                      {errors.newHeadMemberId && (
                        <p className="text-xs text-error font-semibold mt-1">
                          {errors.newHeadMemberId.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            {/* Old Head Action Selection */}
            <div className="space-y-1.5">
              <Controller
                name="oldHeadAction"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      label={`Tindakan Terhadap Kepala Keluarga Lama (${currentHeadName})`}
                      required={true}
                      value={field.value}
                      onChange={field.onChange}
                      options={actionOptions}
                      placeholder="-- Pilih Tindakan --"
                    />
                    {errors.oldHeadAction && (
                      <p className="text-xs text-error font-semibold mt-1">
                        {errors.oldHeadAction.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Email input for New Head of Family */}
            <FormField
              id="newHeadEmail"
              label="Email untuk Akun Login Kepala Keluarga Baru (Opsional jika sudah memiliki akun)"
              type="email"
              placeholder="Contoh: kepala.baru@email.com"
              registerProps={register("newHeadEmail")}
              icon={Mail}
              error={errors.newHeadEmail?.message}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-2 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-sm font-semibold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || memberOptions.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
