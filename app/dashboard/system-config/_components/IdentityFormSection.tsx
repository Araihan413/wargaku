import React, { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SystemConfigFormState } from "../types";

interface IdentityFormSectionProps {
  form: SystemConfigFormState;
  onChange: (field: keyof SystemConfigFormState, value: string) => void;
}

export const IdentityFormSection: React.FC<IdentityFormSectionProps> = ({
  form,
  onChange,
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Perangkat atau browser Anda tidak mendukung deteksi lokasi GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        onChange("latitude", lat);
        onChange("longitude", lng);
        setIsLocating(false);
        toast.success(`Lokasi GPS berhasil dideteksi: (${lat}, ${lng})`);
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation error:", error);
        let errorMsg = "Gagal mengambil lokasi GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin lokasi ditolak. Silakan izinkan akses lokasi di browser HP/Komputer Anda.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Informasi lokasi tidak tersedia saat ini.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Waktu permintaan lokasi habis.";
        }
        toast.error(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-border bg-gray-sidebar-hover/30">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
            Identitas Wilayah & Lokasi Sekretariat RT
          </h2>
          <p className="text-[11px] text-gray-secondary-text">
            Data identitas wilayah, alamat Rumah Ketua RT / Sekretariat, dan titik koordinat GPS presisi.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        {/* Nama RT */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Nama RT
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.rtName}
            onChange={(e) => onChange("rtName", e.target.value)}
            placeholder="misal: RT 03"
            maxLength={50}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Nama RW */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Nama RW
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.rwName}
            onChange={(e) => onChange("rwName", e.target.value)}
            placeholder="misal: RW 08"
            maxLength={50}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Kelurahan / Desa */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kelurahan / Desa
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.villageName}
            onChange={(e) => onChange("villageName", e.target.value)}
            placeholder="misal: Kelurahan Mulyorejo"
            maxLength={100}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Kecamatan */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kecamatan
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.subdistrict}
            onChange={(e) => onChange("subdistrict", e.target.value)}
            placeholder="misal: Kecamatan Sukolilo"
            maxLength={100}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Kota / Kabupaten */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kota / Kabupaten
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="misal: Kota Surabaya"
            maxLength={100}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Alamat Sekretariat / Rumah Ketua RT */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Alamat Sekretariat / Rumah Ketua RT
          </label>
          <textarea
            value={form.secretariatAddress || ""}
            onChange={(e) => onChange("secretariatAddress", e.target.value)}
            placeholder="misal: Jl. Raya Mulyorejo No. 45, RT 03 RW 08 (Rumah Ketua RT)"
            rows={3}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>

        {/* --- GPS Location Detection Box --- */}
        <div className="sm:col-span-2 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                Koordinat Presisi Peta GPS Sekretariat RT
              </h4>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                Gunakan tombol di bawah untuk mengambil titik koordinat GPS dari lokasi posisi Anda saat ini.
              </p>
            </div>

            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendeteksi Lokasi GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Gunakan Lokasi GPS Saya Saat Ini</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Latitude */}
            <div>
              <label className="block text-xs font-semibold text-indigo-900 tracking-wider mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="text"
                value={form.latitude || ""}
                onChange={(e) => onChange("latitude", e.target.value)}
                placeholder="misal: -7.782145"
                className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-sm text-gray-heading-main focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 font-mono transition-all"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-xs font-semibold text-indigo-900 tracking-wider mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="text"
                value={form.longitude || ""}
                onChange={(e) => onChange("longitude", e.target.value)}
                placeholder="misal: 110.365412"
                className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-sm text-gray-heading-main focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 font-mono transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
