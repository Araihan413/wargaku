"use client";

import React from "react";
import { Settings, Type, FileText, Eye, Info } from "lucide-react";
import { QrTemplateType, QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";
import { CustomSelect } from "@/components/CustomSelect";
import { getAppBaseUrl } from "@/lib/config";


interface QrSettingTabProps {
  template: QrTemplateType;
  title: string;
  subtitle: string;
  onTemplateChange: (t: QrTemplateType) => void;
  onTitleChange: (t: string) => void;
  onSubtitleChange: (s: string) => void;
}

const TEMPLATE_OPTIONS = [
  { value: "mini_sticker", label: "Stiker Pintu / Mini (8 x 10 cm)" },
  { value: "desk_standee", label: "Standee Meja / Display (12 x 18 cm)" },
  { value: "a4_poster", label: "Poster Full A4 (Ukuran Besar)" },
];

export const QrSettingTab: React.FC<QrSettingTabProps> = ({
  template,
  title,
  subtitle,
  onTemplateChange,
  onTitleChange,
  onSubtitleChange,
}) => {
  return (
    <div className="space-y-6">

      {/* Informational Banner */}
      <div className="flex items-center gap-3 p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium print:hidden">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Settingan QR Code Ini Akan Digunakan Untuk Seluruh Tab.
        </span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Pengaturan Desain &amp; Ukuran QR Code
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ubah ukuran cetak, judul utama, dan subjudul. Pratinjau di samping akan langsung memperbarui tampilan secara real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 items-start">
          {/* Form Settings */}
          <div className="lg:col-span-1 space-y-4">
            {/* Format Ukuran pakai CustomSelect */}
            <div>
              <CustomSelect
                label="Ukuran / Format Cetak"
                value={template}
                onChange={(val) => onTemplateChange(val as QrTemplateType)}
                options={TEMPLATE_OPTIONS}
              />
            </div>

            {/* Input Judul */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-600" />
                <span>Judul Header QR Code</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Contoh: STIKER PINTU RUMAH WARGA"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>

            {/* Input Subjudul */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Subjudul / Keterangan Tambahan</span>
              </label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={(e) => onSubtitleChange(e.target.value)}
                placeholder="Contoh: Pindai QR code ini menggunakan kamera HP untuk mengakses profil & informasi resmi hunian."
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
              />
            </div>
          </div>

          {/* Live Preview - HANYA DI TAB 1 */}
          <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Preview Stiker</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Real-time</span>
            </div>

            <div className="w-full flex justify-center py-2 overflow-x-auto">
              <QrCodePrintCanvas
                title={title}
                subtitle={subtitle}
                qrUrl={`${getAppBaseUrl()}/scan-qr?token=CONTOH-A1-12`}
                template={template}
                dwellingLabel="Contoh: Blok A1 No. 12"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
