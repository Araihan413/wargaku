"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { executeWithFileUpload } from "@/lib/upload-helper";
import { CustomSelect } from "@/components/CustomSelect";
import { commonEducations, commonOccupations } from "@/lib/constants";
import { KtpUploadInput } from "@/components/KtpUploadInput";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId: number;
  roomList?: string[];
  initialRoom?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
  roomList = [],
  initialRoom = "",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [tenantType, setTenantType] = useState<"perorangan" | "keluarga">("perorangan");
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [roomNumber, setRoomNumber] = useState(initialRoom);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama penyewa wajib diisi");
      return;
    }

    if (nik.length !== 16 || !/^[0-9]{16}$/.test(nik)) {
      toast.error("NIK harus terdiri dari 16 digit angka");
      return;
    }

    if (phone && phone.trim() !== "") {
      const cleanPhone = phone.replace(/[-\s]/g, "");
      const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
      if (!indonesianPhoneRegex.test(cleanPhone)) {
        toast.error("Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)");
        return;
      }
    }

    if (tenantType === "perorangan" && !ktpFile) {
      toast.error("File KTP wajib diunggah untuk Sensitas Warga");
      return;
    }

    if (tenantType === "keluarga" && !email.trim()) {
      toast.error("Email Kepala Keluarga wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await executeWithFileUpload({
        file: tenantType === "perorangan" ? ktpFile : null,
        folder: "ktp",
        submitFn: (ktpUrl) =>
          fetch(`/api/rentals/${propertyId}/residents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantType,
              name,
              nik,
              phone: phone ? phone.trim() : undefined,
              email: tenantType === "keluarga" ? email.trim() : undefined,
              originAddress: tenantType === "perorangan" ? originAddress : undefined,
              occupation: tenantType === "perorangan" ? occupation : undefined,
              educationLevel: tenantType === "perorangan" ? educationLevel : undefined,
              roomNumber: roomNumber ? roomNumber.trim() : undefined,
              checkInDate: new Date(checkInDate),
              ktpFile: tenantType === "perorangan" ? ktpUrl : null,
            }),
          }),
        successMessage:
          tenantType === "keluarga"
            ? "Penyewa Keluarga berhasil didaftarkan! Kredensial login dikirim ke email Kepala Keluarga."
            : "Penyewa berhasil check-in! Menunggu verifikasi dokumen oleh RT.",
      });

      if (result.success) {
        onSuccess();
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setNik("");
    setPhone("");
    setEmail("");
    setOriginAddress("");
    setOccupation("");
    setEducationLevel("");
    setRoomNumber("");
    setCheckInDate(new Date().toISOString().split("T")[0]);
    setKtpFile(null);
    setTenantType("perorangan");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition-all cursor-pointer z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 shrink-0 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-heading-main">Pendaftaran Check-In Penyewa</h2>
          </div>
          <p className="text-xs text-gray-secondary-text">
            Masukkan informasi lengkap calon penyewa baru untuk didaftarkan ke sistem RT.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Container for Fields */}
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
          {/* Tenant Type */}
          <CustomSelect
            value={tenantType}
            onChange={(val) => setTenantType(val as "perorangan" | "keluarga")}
            options={[
              { value: "perorangan", label: "Perorangan (Individu)" },
              { value: "keluarga", label: "Keluarga (Satu KK)" },
            ]}
            label="Tipe Penyewa"
            required
          />

          {/* Name & NIK */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nama Lengkap Penyewa <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Sesuai KTP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                NIK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="NIK Warga"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                required
              />
            </div>
          </div>

          {/* Phone & Room Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nomor HP/WA <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 0812..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {roomList && roomList.length > 0 ? (
              <CustomSelect
                value={roomNumber}
                onChange={setRoomNumber}
                options={roomList.map((r) => ({ value: r, label: r }))}
                placeholder="-- Pilih Kamar --"
                label="Nomor/Nama Kamar"
                required
              />
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nomor/Nama Kamar <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kamar 01, A2"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            )}
          </div>

          {/* Email (Sewa Keluarga saja) */}
          {tenantType === "keluarga" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Email Kepala Keluarga <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                placeholder="Contoh: kepala.keluarga@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          )}

          {/* Origin Address (Perorangan saja) */}
          {tenantType === "perorangan" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Alamat Asal KTP <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                placeholder="Alamat asal luar daerah"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-15 resize-none"
                required
              />
            </div>
          )}

          {/* Occupation & Education (Perorangan saja) */}
          {tenantType === "perorangan" && (
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                value={occupation}
                onChange={setOccupation}
                options={commonOccupations.map((o) => ({ value: o, label: o }))}
                placeholder="-- Pilih Pekerjaan --"
                label="Pekerjaan"
              />
              <CustomSelect
                value={educationLevel}
                onChange={setEducationLevel}
                options={commonEducations.map((e) => ({ value: e, label: e }))}
                placeholder="-- Pilih Pendidikan --"
                label="Pendidikan Terakhir"
              />
            </div>
          )}

          {/* Check-In Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Tanggal Check-In <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          {/* KTP File Upload (Perorangan saja) */}
          {tenantType === "perorangan" && (
            <div className="space-y-1.5">
              <KtpUploadInput
                value={ktpFile}
                onChange={setKtpFile}
                label="Unggah Foto/Scan KTP Penyewa"
                required
              />
            </div>
          )}

          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-border/50 shrink-0 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-700 disabled:bg-primary/50 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Daftarkan Penyewa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
