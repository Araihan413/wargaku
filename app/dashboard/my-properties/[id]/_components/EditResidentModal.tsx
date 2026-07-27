"use client";

import React, { useState } from "react";
import { X, Loader2, Edit3, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToCloudinary } from "@/lib/upload-helper";
import { CustomSelect } from "@/components/CustomSelect";

interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  roomNumber?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  isActive: boolean;
  notes?: string | null;
  inactiveReason?: "pindah" | "meninggal" | null;
  originAddress?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  ktpFile?: string | null;
}

interface EditResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resident: RentalResidentItem | null;
  roomList?: string[];
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

export const EditResidentModal: React.FC<EditResidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resident,
  roomList = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState(resident?.name || "");
  const [nik, setNik] = useState(resident?.nik || "");
  const [phone, setPhone] = useState(resident?.phone || "");
  const [originAddress, setOriginAddress] = useState(resident?.originAddress || "");
  const [occupation, setOccupation] = useState(resident?.occupation || "");
  const [educationLevel, setEducationLevel] = useState(resident?.educationLevel || "");
  const [roomNumber, setRoomNumber] = useState(resident?.roomNumber || "");
  const [checkInDate, setCheckInDate] = useState(
    resident?.checkInDate ? resident.checkInDate.split("T")[0] : ""
  );
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const existingKtpUrl = resident?.ktpFile || "";

  if (!isOpen || !resident) return null;

  const isVerified = resident.verificationStatus === "verified";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16) {
      toast.error("NIK harus terdiri dari 16 digit angka");
      return;
    }

    setIsSubmitting(true);
    let ktpUrl = existingKtpUrl;

    try {
      // 1. Upload new KTP to Cloudinary if selected
      if (ktpFile) {
        const uploadRes = await uploadFileToCloudinary(ktpFile, "ktp");
        ktpUrl = uploadRes.url;
      }

      // 2. Submit Update
      const res = await fetch(`/api/rental-residents/${resident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        toast.success("Perubahan data penyewa berhasil disimpan.");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Gagal memperbarui data penyewa");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition-all cursor-pointer z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 shrink-0 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
              <Edit3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-heading-main">
              {isVerified ? "Ubah Data Penyewa" : "Perbaiki Data Penyewa"}
            </h2>
          </div>
          <p className="text-xs text-gray-secondary-text">
            {isVerified 
              ? "Ubah data kontak dan operasional penyewa yang terverifikasi." 
              : "Perbaiki data penyewa agar dapat diajukan kembali ke RT."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Container for Fields */}
          <div className="flex-1 overflow-y-auto pr-1.5 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-placeholder">
            {/* Verified Banner */}
            {isVerified && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-5 space-y-1">
                <span className="text-xs font-bold text-emerald-700 block">Data Telah Terverifikasi RT:</span>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Data identitas utama (Nama, NIK, Tanggal Check-In, KTP) telah diverifikasi dan dikunci. Anda hanya dapat mengubah data kontak & informasi operasional lainnya.
                </p>
              </div>
            )}

        {/* Rejection Note Alert Banner */}
        {resident.verificationStatus === "rejected" && resident.verificationNote && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-5 space-y-1">
            <span className="text-xs font-bold text-rose-700 block">Alasan Penolakan RT:</span>
            <p className="text-xs text-rose-600 leading-relaxed italic">
              &ldquo;{resident.verificationNote}&rdquo;
            </p>
          </div>
        )}

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
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                required
                disabled={isVerified}
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
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                required
                disabled={isVerified}
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

          {/* Origin Address */}
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

          {/* Occupation & Education */}
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              value={occupation}
              onChange={setOccupation}
              options={occupationOptions.map((o) => ({ value: o, label: o }))}
              placeholder="-- Pilih Pekerjaan --"
              label="Pekerjaan"
              required
            />
            <CustomSelect
              value={educationLevel}
              onChange={setEducationLevel}
              options={educationOptions.map((e) => ({ value: e, label: e }))}
              placeholder="-- Pilih Pendidikan --"
              label="Pendidikan Terakhir"
              required
            />
          </div>

          {/* Check-In Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Tanggal Check-In <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={isVerified}
            />
          </div>

          {/* KTP File Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Unggah Foto/Scan KTP Baru (Opsional)
            </label>
            <div className={`relative border border-dashed border-gray-border rounded-xl p-4 text-center transition-all ${isVerified ? 'opacity-60 bg-gray-border/10 cursor-not-allowed' : 'hover:bg-gray-sidebar-hover/20'}`}>
              {!isVerified && (
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              )}
              <div className="space-y-1 text-xs text-gray-secondary-text">
                <Upload className="h-6 w-6 text-gray-placeholder mx-auto" />
                <p className="font-bold text-gray-heading-main">
                  {ktpFile ? ktpFile.name : isVerified ? "Berkas KTP Terkunci" : "Pilih berkas baru jika ingin mengganti KTP"}
                </p>
                <p className="text-[10px] text-gray-placeholder">Maksimal ukuran 2MB (JPG/PNG/PDF)</p>
              </div>
            </div>
            {existingKtpUrl && !ktpFile && (
              <p className="text-[10px] text-primary font-semibold">
                * Sudah ada scan KTP tersimpan.
              </p>
            )}
          </div>

          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-border/50 shrink-0 mt-4">
            <button
              type="button"
              onClick={onClose}
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
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
