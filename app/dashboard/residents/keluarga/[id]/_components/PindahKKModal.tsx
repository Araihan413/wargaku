import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Search, CreditCard, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { transferFamilyMemberSchema } from "@/lib/validations/kependudukan";
import { FormField } from "@/components/FormField";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { DwellingOption } from "../../../types";
import { relationshipOptions } from "@/lib/constants";

interface PindahKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId: number;
  memberName: string;
  memberNik: string;
  currentFamilyId: number;
}

export const PindahKKModal: React.FC<PindahKKModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  memberName,
  memberNik,
  currentFamilyId,
}) => {
  const [activeMode, setActiveMode] = useState<"existing" | "new">("existing");
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamilyString, setSelectedFamilyString] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transferFamilyMemberSchema),
    defaultValues: {
      memberId: memberId,
      relationship: "Lainnya" as any,
      createNewFamily: false,
      targetFamilyId: undefined as any,
      familyNumber: "",
      dwellingId: undefined as any,
      unitNumber: "",
      checkInDate: "",
    },
  });

  // Keep memberId updated in form state when prop changes
  useEffect(() => {
    setValue("memberId", memberId);
  }, [memberId, setValue]);

  // Sync mode with createNewFamily field
  useEffect(() => {
    setValue("createNewFamily", activeMode === "new");
    if (activeMode === "new") {
      setValue("relationship", "Kepala_Keluarga");
      setValue("targetFamilyId", null);
    } else {
      setValue("relationship", "Lainnya");
      setValue("familyNumber", "");
      setValue("dwellingId", null);
    }
  }, [activeMode, setValue]);

  // Fetch options (dwellings and existing families)
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Fetch dwellings
        const resDwellings = await fetch("/api/dwellings");
        const dataDwellings = resDwellings.ok ? await resDwellings.json() : [];
        setDwellings(dataDwellings);

        // Fetch families (exclude current family to prevent moving to same family)
        const resFamilies = await fetch("/api/families?limit=100&isActive=true");
        if (resFamilies.ok) {
          const dataFamilies = await resFamilies.json();
          const filtered = (dataFamilies.data || []).filter(
            (f: any) => f.id !== currentFamilyId
          );
          setFamilies(filtered);
        }
      } catch (err) {
        console.error("Gagal memuat opsi pindah KK:", err);
        toast.error("Gagal memuat daftar hunian atau KK.");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen, currentFamilyId]);

  const handleClose = () => {
    reset();
    setActiveMode("existing");
    setSelectedFamilyString("");
    onClose();
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        memberId: Number(data.memberId),
        targetFamilyId: data.targetFamilyId ? Number(data.targetFamilyId) : null,
        dwellingId: data.dwellingId ? Number(data.dwellingId) : null,
        familyNumber: data.familyNumber || null,
        unitNumber: data.unitNumber || null,
        checkInDate: data.checkInDate || null,
      };

      const res = await fetch("/api/families/transfer-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Anggota keluarga berhasil dipindahkan");
        reset();
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memindahkan anggota keluarga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat memproses pemindahan");
    }
  };

  if (!isOpen) return null;

  const dwellingSelectOptions: SelectOption[] = dwellings.map((d: any) => ({
    value: d.id.toString(),
    label: `${d.streetName} No. ${d.houseNumber} ${d.blockNumber ? `Blok ${d.blockNumber}` : ""}`,
  }));

  const familySuggestions = families.map(
    (f: any) => `KK ${f.familyNumber} - K.Keluarga: ${f.headName}`
  );

  const pindahRelationshipOptions = relationshipOptions.filter((opt) => opt.value !== "Kepala_Keluarga");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-heading-main">
              Pindah Kartu Keluarga (KK)
            </h3>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Mutasikan {memberName} (NIK: {memberNik}) ke KK lain.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-sidebar-hover p-1 rounded-xl mb-4 shrink-0 border border-gray-border">
          <button
            type="button"
            onClick={() => setActiveMode("existing")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeMode === "existing"
                ? "bg-gray-card text-gray-heading-main shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Masuk KK Lain
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("new")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeMode === "new"
                ? "bg-gray-card text-gray-heading-main shadow-sm"
                : "text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Buat KK Baru
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1.5 pb-32 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {activeMode === "existing" ? (
              <>
                {/* Search Target Family */}
                <div>
                  {isLoadingOptions ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : (
                    <Controller
                      name="targetFamilyId"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <AutocompleteInput
                            label="Cari Kartu Keluarga Tujuan"
                            required={true}
                            value={selectedFamilyString}
                            onChange={(val) => {
                              setSelectedFamilyString(val);
                              // Temukan ID family berdasarkan string yang dipilih
                              const found = families.find(
                                (f: any) => `KK ${f.familyNumber} - K.Keluarga: ${f.headName}` === val
                              );
                              field.onChange(found ? found.id : null);
                            }}
                            suggestions={familySuggestions}
                            placeholder="Ketik nomor KK atau nama..."
                            icon={Search}
                          />
                          {errors.targetFamilyId && (
                            <p className="text-xs text-error font-semibold mt-1">
                              {errors.targetFamilyId.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  )}
                </div>

                {/* Relationship Option */}
                <div className="space-y-1.5">
                  <Controller
                    name="relationship"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Hubungan Keluarga Baru di KK Tujuan"
                          required={true}
                          value={field.value}
                          onChange={field.onChange}
                          options={pindahRelationshipOptions}
                          placeholder="-- Pilih Hubungan --"
                        />
                        {errors.relationship && (
                          <p className="text-xs text-error font-semibold mt-1">
                            {errors.relationship.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Create New Family Card Form */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold mb-2">
                  <Info className="h-5 w-5 shrink-0" />
                  <p>
                    Membuat KK baru otomatis akan menobatkan {memberName} sebagai Kepala Keluarga baru.
                    Data akun login (jika ada) akan otomatis terbawa, namun jika belum memiliki akun, silakan buatkan secara terpisah melalui tombol <strong>Tambah Akun</strong> di halaman Warga & Hunian.
                  </p>
                </div>

                <FormField
                  id="familyNumber"
                  label="Nomor Kartu Keluarga (KK) Baru"
                  type="text"
                  required={true}
                  placeholder="16 digit nomor KK baru"
                  registerProps={register("familyNumber")}
                  icon={CreditCard}
                  error={errors.familyNumber?.message}
                />

                <div className="space-y-1.5">
                  <Controller
                    name="dwellingId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Alamat Hunian Baru"
                          required={true}
                          value={field.value ? field.value.toString() : ""}
                          onChange={(val) => field.onChange(val ? Number(val) : null)}
                          options={dwellingSelectOptions}
                          placeholder="-- Pilih Alamat Hunian --"
                        />
                        {errors.dwellingId && (
                          <p className="text-xs text-error font-semibold mt-1">
                            {errors.dwellingId.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </>
            )}
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memindahkan...
                </>
              ) : (
                "Pindahkan Warga"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
