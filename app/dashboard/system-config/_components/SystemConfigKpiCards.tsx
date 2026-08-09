import React from "react";
import { MapPin, Phone, Image as ImageIcon, RefreshCw } from "lucide-react";
import { SystemSettingsData } from "../types";

interface SystemConfigKpiCardsProps {
  settings: SystemSettingsData;
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const countOfficialContacts = (s: SystemSettingsData) => {
  let count = 0;
  if (s.officialRtPhone) count++;
  if (s.officialSecretaryPhone) count++;
  if (s.officialTreasurerPhone) count++;
  if (s.officialEmail) count++;
  return count;
};

export const SystemConfigKpiCards: React.FC<SystemConfigKpiCardsProps> = ({ settings }) => {
  const contactCount = countOfficialContacts(settings);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Identitas Wilayah */}
      <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-indigo-900 tracking-wider">
            Identitas Wilayah
          </span>
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-black text-indigo-700 tracking-tight leading-snug">
            {settings.rtName} / {settings.rwName}
          </h3>
          <p className="text-[11px] text-indigo-800/80 font-medium mt-1 truncate">
            {settings.villageName}, {settings.city}
          </p>
        </div>
      </div>

      {/* 2. Kontak Official */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-emerald-900 tracking-wider">
            Kontak Official Terisi
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <Phone className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
            {contactCount} / 4
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            No.Hp Pengurus & Email
          </p>
        </div>
      </div>

      {/* 3. Logo Kop Surat */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-amber-900 tracking-wider">
            Logo Kop Surat
          </span>
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <ImageIcon className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-700 tracking-tight">
            {settings.logoPath ? "Terpasang" : "Belum Ada"}
          </h3>
          <p className="text-[11px] text-amber-800/80 font-medium mt-1">
            {settings.logoPath ? "Logo aktif ditampilkan di aplikasi" : "Unggah logo untuk kop surat"}
          </p>
        </div>
      </div>

      {/* 4. Terakhir Diperbarui */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-blue-900 tracking-wider">
            Terakhir Diperbarui
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-blue-700 tracking-tight leading-snug">
            {formatDate(settings.updatedAt)}
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Timestamp pembaruan terakhir
          </p>
        </div>
      </div>
    </div>
  );
};
