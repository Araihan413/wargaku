"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, Users, UserCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { executeWithFileUpload } from "@/lib/upload-helper";
import { CustomSelect } from "@/components/CustomSelect";
import { KtpUploadInput } from "@/components/KtpUploadInput";

interface FamilySearchResult {
  id: number;
  familyNumber: string;
  headName: string | null;
  headNik: string | null;
  verificationStatus: string;
}

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

  // Form Fields — Shared
  const [tenantType, setTenantType] = useState<"perorangan" | "keluarga">("perorangan");
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomNumber, setRoomNumber] = useState(initialRoom);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);
  const [ktpFile, setKtpFile] = useState<File | string | null>(null);

  // Keluarga mode: "baru" = Case 2 (email Brevo), "terdaftar" = Case 1 (autocomplete KK)
  const [familyMode, setFamilyMode] = useState<"baru" | "terdaftar">("baru");

  // Keluarga Terdaftar Verifikasi
  const [familyNumberInput, setFamilyNumberInput] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<FamilySearchResult | null>(null);
  const [isFamilySearching, setIsFamilySearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleVerifyFamily = async () => {
    setSearchError("");
    const cleanKk = familyNumberInput.replace(/\D/g, "");
    
    if (cleanKk.length !== 16) {
      setSearchError("Nomor KK harus terdiri dari 16 digit angka.");
      return;
    }

    setIsFamilySearching(true);
    try {
      const res = await fetch(`/api/families/search?kk=${encodeURIComponent(cleanKk)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.found && result.data) {
          setSelectedFamily(result.data);
          toast.success("Data Kartu Keluarga berhasil diverifikasi!");
        } else {
          setSearchError("Data Kartu Keluarga tidak ditemukan di RT ini.");
        }
      } else {
        setSearchError("Terjadi kesalahan saat memverifikasi data.");
      }
    } catch {
      setSearchError("Gagal terhubung ke server.");
    } finally {
      setIsFamilySearching(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // === CASE 1: Keluarga Terdaftar ===
    if (tenantType === "keluarga" && familyMode === "terdaftar") {
      if (!selectedFamily) {
        toast.error("Pilih Kartu Keluarga dari daftar pencarian terlebih dahulu");
        return;
      }
      if (!roomNumber.trim()) {
        toast.error("Nomor Kamar wajib dipilih");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/rentals/${propertyId}/residents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantType: "family",
            familyId: selectedFamily.id,
            name: selectedFamily.headName ?? "",
            nik: selectedFamily.headNik ?? "",
            roomNumber: roomNumber.trim(),
            checkInDate: new Date(checkInDate),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Gagal mendaftarkan penyewa");
          return;
        }
        toast.success("Penyewa Keluarga Terdaftar berhasil dihubungkan ke kamar!");
        onSuccess();
        handleClose();
      } catch {
        toast.error("Gagal mendaftarkan penyewa. Periksa koneksi internet Anda.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // === Validasi Shared (Perorangan & Keluarga Baru) ===
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
      toast.error("File KTP wajib diunggah untuk penyewa perorangan");
      return;
    }
    if (tenantType === "keluarga" && familyMode === "baru" && !email.trim()) {
      toast.error("Email Kepala Keluarga wajib diisi untuk mengirim undangan aktivasi");
      return;
    }

    // === CASE 2: Keluarga Baru & Perorangan ===
    setIsSubmitting(true);
    try {
      const result = await executeWithFileUpload({
        file: ktpFile instanceof File ? ktpFile : null,
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
              roomNumber: roomNumber ? roomNumber.trim() : undefined,
              checkInDate: new Date(checkInDate),
              ktpFile: ktpUrl || (typeof ktpFile === "string" ? ktpFile : null),
            }),
          }),
        successMessage:
          tenantType === "keluarga"
            ? "Penyewa Keluarga berhasil didaftarkan! Email undangan aktivasi telah dikirim."
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
    setRoomNumber("");
    setCheckInDate(new Date().toISOString().split("T")[0]);
    setKtpFile(null);
    setTenantType("perorangan");
    setFamilyMode("baru");
    setFamilyNumberInput("");
    setSelectedFamily(null);
    setSearchError("");
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
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">

            {/* Tenant Type */}
            <CustomSelect
              value={tenantType}
              onChange={(val) => {
                setTenantType(val as "perorangan" | "keluarga");
                setFamilyMode("baru");
                setSelectedFamily(null);
                setFamilyNumberInput("");
                setSearchError("");
              }}
              options={[
                { value: "perorangan", label: "Perorangan (Individu)" },
                { value: "keluarga", label: "Keluarga (Satu KK)" },
              ]}
              label="Tipe Penyewa"
              required
            />

            {/* === SWITCH: Keluarga Baru vs Keluarga Terdaftar === */}
            {tenantType === "keluarga" && (
              <div className="flex gap-2 p-1 bg-gray-sidebar-hover rounded-xl border border-gray-border">
                <button
                  type="button"
                  onClick={() => { setFamilyMode("baru"); setSelectedFamily(null); setFamilyNumberInput(""); setSearchError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    familyMode === "baru"
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-secondary-text hover:text-gray-heading-main"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Keluarga Baru
                </button>
                <button
                  type="button"
                  onClick={() => { setFamilyMode("terdaftar"); setName(""); setNik(""); setPhone(""); setEmail(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    familyMode === "terdaftar"
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-secondary-text hover:text-gray-heading-main"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Keluarga Terdaftar
                </button>
              </div>
            )}

            {/* === CASE 1: Keluarga Terdaftar — Verifikasi Exact Match === */}
            {tenantType === "keluarga" && familyMode === "terdaftar" && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Demi menjaga privasi data, silakan verifikasi Kartu Keluarga dengan memasukkan 16 digit Nomor KK secara lengkap dan tepat.</span>
                </div>

                {!selectedFamily ? (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Nomor Kartu Keluarga <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Masukkan 16 digit Nomor KK..."
                          value={familyNumberInput}
                          onChange={(e) => {
                            setFamilyNumberInput(e.target.value.replace(/\D/g, "").slice(0, 16));
                            setSearchError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleVerifyFamily();
                            }
                          }}
                          className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                          autoComplete="off"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyFamily}
                        disabled={isFamilySearching || familyNumberInput.length !== 16}
                        className="px-4 py-2.5 rounded-xl bg-gray-heading-main hover:bg-black disabled:bg-gray-placeholder text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isFamilySearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span>Cek Data</span>
                      </button>
                    </div>
                    {searchError && (
                      <p className="text-xs text-red-500 mt-1 font-medium">{searchError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Data Kartu Keluarga <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex flex-col gap-2 p-3.5 bg-primary/5 border border-primary/20 rounded-xl relative">
                      <button
                        type="button"
                        onClick={() => { setSelectedFamily(null); setFamilyNumberInput(""); }}
                        className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-red-50 text-gray-placeholder hover:text-red-500 transition-colors cursor-pointer"
                        title="Batal"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="pr-8">
                        <p className="text-sm font-bold text-primary font-mono mb-1">{selectedFamily.familyNumber}</p>
                        <p className="text-xs font-medium text-gray-heading-main mb-0.5">Kepala Keluarga: <span className="font-bold">{selectedFamily.headName ?? "—"}</span></p>
                        <p className="text-xs text-gray-secondary-text">NIK: <span className="font-mono">{selectedFamily.headNik ?? "—"}</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === CASE 2 & PERORANGAN: Form Standar === */}
            {(tenantType === "perorangan" || (tenantType === "keluarga" && familyMode === "baru")) && (
              <>
                {/* Name & NIK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      {tenantType === "keluarga" ? "Nama Kepala Keluarga" : "Nama Lengkap Penyewa"} <span className="text-red-500 ml-0.5">*</span>
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
                      {tenantType === "keluarga" ? "NIK Kepala Keluarga" : "NIK (16 Digit)"} <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="16 digit angka"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
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

                {/* Email (Keluarga Baru) */}
                {tenantType === "keluarga" && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Email Kepala Keluarga <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Untuk pengiriman link aktivasi akun"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                )}

                {/* KTP Upload */}
                <div className="space-y-1.5">
                  <KtpUploadInput
                    value={ktpFile}
                    onChange={setKtpFile}
                    label={tenantType === "keluarga" ? "Unggah Scan KTP Kepala Keluarga" : "Unggah Scan KTP Penyewa"}
                    required={tenantType === "perorangan"}
                  />
                </div>
              </>
            )}

            {/* Room Number (Selalu tampil) */}
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
