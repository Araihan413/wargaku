import React from "react";
import { Building2, MapPin, Mail, Phone, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SystemSettingInfo } from "./types";

interface SystemIdentityCardProps {
  info: SystemSettingInfo | null;
}

export const SystemIdentityCard: React.FC<SystemIdentityCardProps> = ({ info }) => {
  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main tracking-tight">
              Identitas & Metadata Wilayah
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Konfigurasi umum identitas RT/RW dan kontak official pengurus
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/system-config"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan System</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* RT/RW & Wilayah */}
        <div className="space-y-1 bg-gray-50/70 p-3.5 rounded-xl border border-gray-border/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Unit Wilayah RT/RW</span>
          </div>
          <p className="text-sm font-extrabold text-primary">
            {info ? `${info.rtName} / ${info.rwName}` : "RT 03 / RW 08"}
          </p>
          <p className="text-xs text-gray-secondary-text">
            {info ? `${info.villageName}, ${info.subdistrict}, ${info.city}` : "Mulyorejo, Surabaya"}
          </p>
        </div>

        {/* Email Official */}
        <div className="space-y-1 bg-gray-50/70 p-3.5 rounded-xl border border-gray-border/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>Email Official RT</span>
          </div>
          <p className="text-sm font-extrabold text-gray-heading-main truncate">
            {info?.officialEmail || "rt03.rw08@wargaku.id"}
          </p>
          <p className="text-xs text-gray-secondary-text">
            Saluran komunikasi resmi sistem
          </p>
        </div>

        {/* Kontak Pengurus */}
        <div className="space-y-1 bg-gray-50/70 p-3.5 rounded-xl border border-gray-border/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-heading-main">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>Kontak Official RT</span>
          </div>
          <p className="text-sm font-extrabold text-gray-heading-main">
            {info?.officialRtPhone || "0812-3456-7890"}
          </p>
          <p className="text-xs text-gray-secondary-text">
            No. WhatsApp Official Ketua RT
          </p>
        </div>
      </div>
    </div>
  );
};
