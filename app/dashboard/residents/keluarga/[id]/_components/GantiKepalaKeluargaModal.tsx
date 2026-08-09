import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Info } from "lucide-react";

import { toast } from "sonner";
import { changeFamilyHeadSchema, ChangeFamilyHeadInput } from "@/lib/validations/kependudukan";
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
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeFamilyHeadInput>({
    resolver: zodResolver(changeFamilyHeadSchema),
    defaultValues: {
      newHeadMemberId: undefined as any,
    },
  });

  const handleClose = () => {
    reset({
      newHeadMemberId: undefined as any,
    });
    onClose();
  };

  const onSubmit = async (data: ChangeFamilyHeadInput) => {
    try {
      const response = await fetch(`/api/families/${familyId}/change-head`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengubah Kepala Keluarga");
      }

      toast.success("Kepala Keluarga berhasil diubah. Jabatan kepala lama diubah menjadi Anggota (Lainnya).");
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message);
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

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-0 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
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

        {/* Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden p-6 gap-6"
        >
          <div className="flex-1 overflow-y-auto space-y-6 px-1 py-1 custom-scrollbar">
            {/* Warning Callout */}
            <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-start gap-3 text-sm text-error">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">
                  Pemberitahuan Keamanan:
                </span>
                Mengganti Kepala Keluarga akan mereset status verifikasi KK menjadi{" "}
                <span className="font-bold">Pending</span>. Jabatan Kepala Keluarga lama ({currentHeadName}) akan otomatis diubah menjadi Anggota (Lainnya). Akses login dari Kepala Keluarga lama (jika ada) ke data KK ini akan dicabut sepenuhnya.
              </div>
            </div>

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
