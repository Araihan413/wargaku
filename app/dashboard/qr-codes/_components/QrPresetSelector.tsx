import React from "react";
import { Building2, Home, QrCode, Link as LinkIcon } from "lucide-react";
import { QrPresetType } from "../types";

interface QrPresetSelectorProps {
  selectedPreset: QrPresetType;
  onSelectPreset: (preset: QrPresetType) => void;
}

const presets: {
  key: QrPresetType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  badge: string;
}[] = [
  {
    key: "rt_public",
    title: "Portal Publik RT & Sekre",
    desc: "Cetak banner/poster resmi sekretariat untuk aduan warga & registrasi.",
    icon: <Building2 className="w-5 h-5" />,
    badge: "Rekomendasi Sekre",
  },
  {
    key: "dwelling_sticker",
    title: "Hunian / Rumah Warga",
    desc: "Cetak stiker pintu rumah warga untuk identitas & verifikasi cepat.",
    icon: <Home className="w-5 h-5" />,
    badge: "Stiker Pintu",
  },
  {
    key: "rental_property",
    title: "Kos / Properti Sewa",
    desc: "Cetak papan info kos untuk pindaian data penghuni kos.",
    icon: <QrCode className="w-5 h-5" />,
    badge: "Sewa Kos",
  },
  {
    key: "custom_url",
    title: "Link / URL Kustom",
    desc: "Cetak QR Code dengan tautan atau teks acuan bebas.",
    icon: <LinkIcon className="w-5 h-5" />,
    badge: "Kustom",
  },
];

export const QrPresetSelector: React.FC<QrPresetSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {presets.map((p) => {
        const isSelected = selectedPreset === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelectPreset(p.key)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              isSelected
                ? "bg-primary/10 border-primary shadow-sm"
                : "bg-gray-card border-gray-border hover:bg-gray-sidebar-hover/30"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`p-2 rounded-xl ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-secondary-text"
                }`}
              >
                {p.icon}
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {p.badge}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
                {p.title}
              </h3>
              <p className="text-[11px] text-gray-secondary-text mt-0.5 leading-snug line-clamp-2">
                {p.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
