import React from "react";
import { MapPin } from "lucide-react";
import { SystemConfigFormState } from "../types";

interface IdentityFormSectionProps {
  form: SystemConfigFormState;
  onChange: (field: keyof SystemConfigFormState, value: string) => void;
}

export const IdentityFormSection: React.FC<IdentityFormSectionProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-border bg-gray-sidebar-hover/30">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
            Identitas Wilayah RT
          </h2>
          <p className="text-[11px] text-gray-secondary-text">
            Data identitas yang akan tampil pada kop surat pengantar warga dan header aplikasi.
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
        <div>
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

        {/* Alamat Sekretariat (full-width) */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Alamat Sekretariat RT
          </label>
          <textarea
            value={form.secretariatAddress || ""}
            onChange={(e) => onChange("secretariatAddress", e.target.value)}
            placeholder="misal: Jl. Raya Mulyorejo No. 45, RT 03 RW 08"
            rows={3}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
};
