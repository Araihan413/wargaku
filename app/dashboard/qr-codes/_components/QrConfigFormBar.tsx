import React from "react";
import { SlidersHorizontal, Link as LinkIcon } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { DwellingOption } from "@/db/queries/qr-codes";
import { QrConfigState } from "../types";

interface QrConfigFormBarProps {
  config: QrConfigState;
  dwellings: DwellingOption[];
  onChange: (newConfig: Partial<QrConfigState>) => void;
}

const templateOptions = [
  { value: "a4_poster", label: "Poster Full A4 (Banner Display RT)" },
  { value: "mini_sticker", label: "Stiker Pintu / Pos (8×10 cm)" },
  { value: "desk_standee", label: "Standee Meja (Akrilik Sekretariat)" },
];

export const QrConfigFormBar: React.FC<QrConfigFormBarProps> = ({
  config,
  dwellings,
  onChange,
}) => {
  const isDwellingPreset =
    config.preset === "dwelling_sticker" || config.preset === "rental_property";
  const isCustomPreset = config.preset === "custom_url";

  const dwellingOptions = [
    { value: "", label: "— Pilih Rumah / Hunian Warga —" },
    ...dwellings.map((d) => ({
      value: String(d.id),
      label: `Blok ${d.blockNumber} No. ${d.houseNumber} ${
        d.familyHeadName ? `(${d.familyHeadName})` : ""
      }`,
    })),
  ];

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-border pb-3">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
          Pengaturan Parameter Tampilan & Cetak
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dwelling Selector (If Dwelling Preset) */}
        {isDwellingPreset && (
          <div className="sm:col-span-2 lg:col-span-1">
            <CustomSelect
              label="Pilih Hunian / Rumah Warga"
              value={config.selectedDwellingId ? String(config.selectedDwellingId) : ""}
              onChange={(val) =>
                onChange({ selectedDwellingId: val ? parseInt(val, 10) : null })
              }
              options={dwellingOptions}
            />
          </div>
        )}

        {/* Custom URL Input (If Custom Preset) */}
        {isCustomPreset && (
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              URL / Tautan Kustom
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={config.customUrl}
                onChange={(e) => onChange({ customUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Template Size Option */}
        <div>
          <CustomSelect
            label="Template Ukuran Cetak"
            value={config.template}
            onChange={(val) => onChange({ template: val as any })}
            options={templateOptions}
          />
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Judul Utama Poster
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Judul poster..."
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Subtitle Input */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Subjudul / Petunjuk Pindaian
          </label>
          <input
            type="text"
            value={config.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Petunjuk scan..."
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 pt-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-heading-main cursor-pointer">
            <input
              type="checkbox"
              checked={config.showLogo}
              onChange={(e) => onChange({ showLogo: e.target.checked })}
              className="w-4 h-4 text-primary rounded-md border-gray-border focus:ring-primary"
            />
            <span>Tampilkan Logo RT</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-gray-heading-main cursor-pointer">
            <input
              type="checkbox"
              checked={config.showContacts}
              onChange={(e) => onChange({ showContacts: e.target.checked })}
              className="w-4 h-4 text-primary rounded-md border-gray-border focus:ring-primary"
            />
            <span>Tampilkan Footer Kontak Official</span>
          </label>
        </div>
      </div>
    </div>
  );
};
