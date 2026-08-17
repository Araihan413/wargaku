import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, User, CreditCard, Phone, Calendar, Home } from "lucide-react";
import { FormField } from "@/components/FormField";
import { updateRentalResidentSchema } from "@/lib/validations/rental";
import { executeWithFileUpload } from "@/lib/upload-helper";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { RentalResidentItem } from "./RentalTable";
import { formatDateForInput } from "@/lib/date-format";

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateRentalResidentSchema),
  });

  const [ktpFile, setKtpFile] = useState<File | string | null>(null);
  const [isKtpSameVillage, setIsKtpSameVillage] = useState<boolean>(false);
  const [ktpAddress, setKtpAddress] = useState<string>("");
  const [villageName, setVillageName] = useState<string>("");

  useEffect(() => {
    async function loadVillageInfo() {
      try {
        const res = await fetch("/api/public/portal");
        if (res.ok) {
          const data = await res.json();
          if (data?.settings?.villageName) {
            setVillageName(data.settings.villageName);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadVillageInfo();
  }, []);

  // Populate data when resident changes or modal opens
  useEffect(() => {
    if (isOpen && resident) {
      reset({
        name: resident.name || "",
        nik: resident.nik || "",
        phone: resident.phone || "",
        checkInDate: formatDateForInput(resident.checkInDate),
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKtpFile(resident.ktpFile || null);
      setIsKtpSameVillage((resident as any).isKtpSameVillage ?? (resident as any).is_ktp_same_village ?? false);
      setKtpAddress((resident as any).ktpAddress ?? (resident as any).ktp_address ?? "");
    }
  }, [isOpen, resident, reset]);

  const handleClose = () => {
    setKtpFile(null);
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!resident) return;

    // Convert Date object to YYYY-MM-DD string
    let checkInDateStr = resident.checkInDate;
    if (data.checkInDate instanceof Date) {
      checkInDateStr = data.checkInDate.toISOString().split("T")[0];
    } else if (typeof data.checkInDate === "string") {
      checkInDateStr = data.checkInDate.split("T")[0];
    }

    const result = await executeWithFileUpload({
      file: ktpFile instanceof File ? ktpFile : null,
      folder: "ktp",
      submitFn: (finalKtpUrl) =>
        fetch(`/api/rental-residents/${resident.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            checkInDate: checkInDateStr,
            isKtpSameVillage,
            ktpAddress: !isKtpSameVillage ? ktpAddress.trim() : null,
            ktpFile: finalKtpUrl || (typeof ktpFile === "string" ? ktpFile : null),
          }),
        }),
      successMessage: "Data penyewa berhasil diperbarui.",
    });

    if (result.success) {
      handleClose();
      onSuccess();
    }
  };

  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Edit Data Penyewa</h3>
              <p className="text-[10px] text-gray-secondary-text">Perbarui rincian data penyewa kos/kontrakan</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 text-xs text-primary leading-relaxed font-semibold mb-2">
              <Home className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Properti: {resident.propertyName}</p>
                <p className="mt-0.5">Blok {resident.blockNumber} No. {resident.houseNumber} &bull; Tipe: <span className="capitalize">{resident.tenantType || "Perorangan"}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <FormField
                id="name"
                label="Nama Lengkap Penyewa"
                type="text"
                placeholder="Sesuai KTP"
                required={true}
                icon={User}
                registerProps={register("name")}
                error={errors.name?.message as string}
              />

              {/* NIK */}
              <FormField
                id="nik"
                label="NIK (16 Digit)"
                type="text"
                placeholder="16 Digit NIK"
                required={true}
                icon={CreditCard}
                maxLength={16}
                registerProps={register("nik")}
                error={errors.nik?.message as string}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <FormField
                id="phone"
                label="Nomor WhatsApp"
                type="text"
                placeholder="Contoh: 081234567890"
                icon={Phone}
                registerProps={register("phone")}
                error={errors.phone?.message as string}
              />

              {/* Check-In Date */}
              <FormField
                id="checkInDate"
                label="Tanggal Check-In"
                type="date"
                placeholder="YYYY-MM-DD"
                required={true}
                icon={Calendar}
                registerProps={register("checkInDate", { valueAsDate: true })}
                error={errors.checkInDate?.message as string}
              />
            </div>

            {/* Status Domisili KTP */}
            <div className="rounded-2xl border border-gray-border bg-gray-sidebar-hover/40 p-4 space-y-3">
              <label className="block text-sm font-semibold text-black/80 tracking-wider">
                Status Alamat KTP <span className="text-red-500 ml-0.5">*</span>
              </label>
              <p className="text-xs text-gray-secondary-text">
                Apakah alamat pada KTP penyewa ini berada di {villageName ? `Kelurahan ${villageName}` : "Kelurahan setempat"}?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isKtpSameVillage ? "border-primary bg-primary/5 text-primary-900 font-semibold" : "border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover"}`}>
                  <input
                    type="radio"
                    name="editTenantIsKtpSameVillage"
                    checked={isKtpSameVillage === false}
                    onChange={() => setIsKtpSameVillage(false)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs">
                    KTP Luar Kelurahan
                  </span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isKtpSameVillage ? "border-primary bg-primary/5 text-primary-900 font-semibold" : "border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover"}`}>
                  <input
                    type="radio"
                    name="editTenantIsKtpSameVillage"
                    checked={isKtpSameVillage === true}
                    onChange={() => {
                      setIsKtpSameVillage(true);
                      setKtpAddress("");
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs">
                    KTP {villageName ? `Kel. ${villageName}` : "Kelurahan Setempat"}
                  </span>
                </label>
              </div>

              {!isKtpSameVillage && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-gray-heading-main mb-1.5">
                    Alamat / Kota Asal Sesuai KTP <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={ktpAddress}
                    onChange={(e) => setKtpAddress(e.target.value)}
                    placeholder="Contoh: Kota Cirebon / Kec. Kesambi"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required={!isKtpSameVillage}
                  />
                </div>
              )}
            </div>

            {/* KTP Upload Component */}
            <div className="space-y-1.5 pt-2">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label="Unggah Scan KTP"
                required={resident.tenantType === "perorangan"}
                existingUrl={typeof ktpFile === "string" ? ktpFile : undefined}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
