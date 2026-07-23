"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, Upload} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToCloudinary } from "@/lib/upload-helper";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId: number;
}

const educationOptions = [
  "Tidak/Belum Sekolah",
  "SD / Sederajat",
  "SMP / Sederajat",
  "SMA / SMK / Sederajat",
  "Diploma I / II",
  "Akademi / Diploma III (D3)",
  "Diploma IV / Sarjana (S1)",
  "Magister (S2)",
  "Doktor (S3)",
];

const occupationOptions = [
  "Belum/Tidak Bekerja",
  "Mengurus Rumah Tangga",
  "Pelajar/Mahasiswa",
  "Pensiunan",
  "Pegawai Negeri Sipil (PNS)",
  "Tentara Nasional Indonesia (TNI)",
  "Kepolisian RI (POLRI)",
  "Karyawan Swasta",
  "Karyawan BUMN",
  "Karyawan BUMD",
  "Buruh Harian Lepas",
  "Petani/Pekebun",
  "Nelayan",
  "Pedagang",
  "Wiraswasta",
];

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [tenantType, setTenantType] = useState<"perorangan" | "keluarga">("perorangan");
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16) {
      toast.error("NIK harus terdiri dari 16 digit angka");
      return;
    }

    if (!ktpFile) {
      toast.error("File KTP wajib diunggah untuk Sensitas Warga");
      return;
    }

    setIsSubmitting(true);
    let ktpUrl = "";

    try {
      // 1. Upload KTP to Cloudinary
      const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
      ktpUrl = uploadRes.url;

      // 2. Submit Check-In
      const res = await fetch(`/api/rentals/${propertyId}/residents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantType,
          name,
          nik,
          phone,
          originAddress,
          occupation,
          educationLevel,
          roomNumber,
          checkInDate: new Date(checkInDate),
          ktpFile: ktpUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Penyewa berhasil check-in! Menunggu verifikasi dokumen oleh RT.");
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || "Gagal melakukan check-in penyewa");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setNik("");
    setPhone("");
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
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-border animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-heading-main">Pendaftaran Check-In Penyewa</h2>
        </div>
        <p className="text-xs text-gray-secondary-text mb-6">
          Masukkan informasi lengkap calon penyewa baru untuk didaftarkan ke sistem RT.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Tipe Penyewa</label>
            <select
              value={tenantType}
              onChange={(e) => setTenantType(e.target.value as "perorangan" | "keluarga")}
              className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
            >
              <option value="perorangan" className="bg-gray-card">Perorangan (Individu)</option>
              <option value="keluarga" className="bg-gray-card">Keluarga (Satu KK)</option>
            </select>
          </div>

          {/* Name & NIK */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">Nama Lengkap Penyewa</label>
              <input
                type="text"
                placeholder="Sesuai KTP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">NIK (16 Digit)</label>
              <input
                type="text"
                placeholder="NIK Warga"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all font-mono"
                required
              />
            </div>
          </div>

          {/* Phone & Room Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">Nomor HP/WA</label>
              <input
                type="text"
                placeholder="Contoh: 0812..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">Nomor/Nama Kamar</label>
              <input
                type="text"
                placeholder="Misal: Kamar 01, A2"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          {/* Origin Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Alamat Asal KTP</label>
            <textarea
              placeholder="Alamat asal luar daerah"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all min-h-15"
              required
            />
          </div>

          {/* Occupation & Education */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">Pekerjaan</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                required
              >
                <option value="" disabled>-- Pilih Pekerjaan --</option>
                {occupationOptions.map((o) => (
                  <option key={o} value={o} className="bg-gray-card">{o}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-heading-main block">Pendidikan Terakhir</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                required
              >
                <option value="" disabled>-- Pilih Pendidikan --</option>
                {educationOptions.map((eOpt) => (
                  <option key={eOpt} value={eOpt} className="bg-gray-card">{eOpt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Check-In Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Tanggal Check-In</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
              required
            />
          </div>

          {/* KTP File Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-heading-main block">Unggah Foto/Scan KTP Penyewa</label>
            <div className="relative border border-dashed border-gray-border rounded-xl p-4 text-center hover:bg-gray-sidebar-hover/20 transition-all">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={!ktpFile}
              />
              <div className="space-y-1 text-xs text-gray-secondary-text">
                <Upload className="h-6 w-6 text-gray-placeholder mx-auto" />
                <p className="font-bold text-gray-heading-main">
                  {ktpFile ? ktpFile.name : "Pilih Berkas Scan KTP"}
                </p>
                <p className="text-[10px] text-gray-placeholder">Maksimal ukuran 2MB (JPG/PNG/PDF)</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-border/50">
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
