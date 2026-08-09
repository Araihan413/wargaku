import React from "react";
import { Phone, Mail } from "lucide-react";
import { SystemConfigFormState } from "../types";

interface OfficialContactFormSectionProps {
  form: SystemConfigFormState;
  onChange: (field: keyof SystemConfigFormState, value: string) => void;
}

export const OfficialContactFormSection: React.FC<OfficialContactFormSectionProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-border bg-gray-sidebar-hover/30">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
          <Phone className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
            Kontak Official & Pengurus RT
          </h2>
          <p className="text-[11px] text-gray-secondary-text">
            Nomor HP/WA dan email resmi pengurus RT untuk keperluan komunikasi dan kop dokumen surat.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        {/* Email Resmi RT */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Email Resmi RT
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={form.officialEmail || ""}
              onChange={(e) => onChange("officialEmail", e.target.value)}
              placeholder="misal: rt03.mulyorejo@gmail.com"
              maxLength={100}
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* No. HP Ketua RT */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            No. HP / WA Ketua RT
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={form.officialRtPhone || ""}
              onChange={(e) => onChange("officialRtPhone", e.target.value)}
              placeholder="misal: 08123456789"
              maxLength={15}
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* No. HP Sekretaris */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            No. HP / WA Sekretaris
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={form.officialSecretaryPhone || ""}
              onChange={(e) => onChange("officialSecretaryPhone", e.target.value)}
              placeholder="misal: 08198765432"
              maxLength={15}
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* No. HP Bendahara */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            No. HP / WA Bendahara
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={form.officialTreasurerPhone || ""}
              onChange={(e) => onChange("officialTreasurerPhone", e.target.value)}
              placeholder="misal: 08112345678"
              maxLength={15}
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
