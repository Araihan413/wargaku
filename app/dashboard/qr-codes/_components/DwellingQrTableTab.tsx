"use client";

import React, { useState, useMemo } from "react";
import {
  Home,
  Building,
  Building2,
  Search,
  Printer,
  Download,
  CheckSquare,
  Square,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { DwellingOption } from "@/db/queries/population/dwelling.queries";
import { QrTemplateType, QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";
import { CustomSelect } from "@/components/CustomSelect";
import { getAppBaseUrl } from "@/lib/config";


interface DwellingQrTableTabProps {
  dwellings: DwellingOption[];
  template: QrTemplateType;
  title: string;
  subtitle: string;
}

const TYPE_FILTER_OPTIONS = [
  { value: "semua", label: "Semua Tipe Hunian" },
  { value: "permanen", label: "Rumah Permanen" },
  { value: "kos", label: "Kos / Kontrakan" },
  { value: "homestay", label: "Homestay" },
];

export const DwellingQrTableTab: React.FC<DwellingQrTableTabProps> = ({
  dwellings,
  template,
  title,
  subtitle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("semua");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [singlePrintDwelling, setSinglePrintDwelling] = useState<DwellingOption | null>(null);

  // Filtered dwellings based on search & type filter
  const filteredDwellings = useMemo(() => {
    return dwellings.filter((d) => {
      if (typeFilter !== "semua" && d.type !== typeFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const addr = `blok ${d.blockNumber} no ${d.houseNumber} ${d.blockNumber}-${d.houseNumber}`.toLowerCase();
      const owner = (d.ownerName || "").toLowerCase();
      const head = (d.familyHeadName || "").toLowerCase();
      const prop = (d.propertyName || "").toLowerCase();
      return (
        addr.includes(q) ||
        owner.includes(q) ||
        head.includes(q) ||
        prop.includes(q) ||
        d.qrToken.toLowerCase().includes(q)
      );
    });
  }, [dwellings, searchTerm, typeFilter]);

  // Handle Select All
  const isAllSelected =
    filteredDwellings.length > 0 &&
    filteredDwellings.every((d) => selectedIds.includes(d.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filteredDwellings.map((d) => d.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredDwellings.map((d) => d.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Helper compute QR URL for dwelling
  const getDwellingQrUrl = (qrToken: string): string => {
    return `${getAppBaseUrl()}/scan-qr?token=${encodeURIComponent(qrToken)}`;
  };


  const selectedDwellings = useMemo(() => {
    return dwellings.filter((d) => selectedIds.includes(d.id));
  }, [dwellings, selectedIds]);

  // Single Item Download PNG Stiker Utuh
  const handleSingleDownload = async (d: DwellingOption) => {
    try {
      const el = document.getElementById(`dwelling-sticker-card-${d.id}`);
      if (el) {
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `Stiker_QR_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Stiker QR Blok ${d.blockNumber} No. ${d.houseNumber} berhasil diunduh.`);
        return;
      }

      // Fallback
      const qrUrl = getDwellingQrUrl(d.qrToken);
      const url = await QRCode.toDataURL(qrUrl, { width: 800, margin: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_Hunian_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`QR Code Blok ${d.blockNumber} No. ${d.houseNumber} berhasil diunduh.`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh stiker QR Code.");
    }
  };

  // Single Item Print
  const handleSinglePrint = (d: DwellingOption) => {
    setSinglePrintDwelling(d);
    setTimeout(() => {
      window.print();
      setSinglePrintDwelling(null);
    }, 300);
  };

  // Batch Download PNG Stiker Utuh
  const handleBatchDownload = async () => {
    if (selectedDwellings.length === 0) {
      toast.error("Pilih setidaknya 1 hunian untuk diunduh");
      return;
    }

    toast.info(`Mengunduh ${selectedDwellings.length} gambar stiker QR Code...`);

    for (const d of selectedDwellings) {
      try {
        const el = document.getElementById(`dwelling-sticker-card-${d.id}`);
        if (el) {
          const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `Stiker_QR_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const qrUrl = getDwellingQrUrl(d.qrToken);
        const url = await QRCode.toDataURL(qrUrl, { width: 800, margin: 2 });
        const a = document.createElement("a");
        a.href = url;
        a.download = `QR_Hunian_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error("Error downloading QR sticker:", err);
      }
    }

    toast.success(`${selectedDwellings.length} stiker QR Code berhasil diunduh!`);
  };

  // Batch Print
  const handleBatchPrint = () => {
    if (selectedDwellings.length === 0) {
      toast.error("Pilih setidaknya 1 hunian untuk dicetak");
      return;
    }
    setSinglePrintDwelling(null);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "permanen":
        return {
          label: "Permanen",
          bg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Home,
        };
      case "kos":
        return {
          label: "Kos / Kontrakan",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: Building,
        };
      case "homestay":
        return {
          label: "Homestay",
          bg: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Building2,
        };
      default:
        return {
          label: type,
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: Home,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5 print:hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Daftar Hunian Warga
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pilihlah hunian yang ingin dicetak stikernya secara massal atau unduh gambar QR per satuan di kolom aksi.
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar (Standardized Style) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Standard Search Input with Icon */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari blok, no rumah, pemilik..."
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          {/* Filter & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* CustomSelect Component for Filter */}
            <div className="w-full sm:w-52">
              <CustomSelect
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPE_FILTER_OPTIONS}
                size="sm"
              />
            </div>

            {/* Tombol Unduh Pilihan */}
            <button
              type="button"
              onClick={handleBatchDownload}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Terpilih ({selectedIds.length})</span>
            </button>

            {/* Tombol Cetak Pilihan */}
            <button
              type="button"
              onClick={handleBatchPrint}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Selected Items Status Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold">
            <span>{selectedIds.length} hunian terpilih.</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>
        )}

        {/* Dwelling List Table */}
        <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5 w-12 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-gray-secondary-text hover:text-primary transition-colors"
                      title={isAllSelected ? "Batal Pilih Semua" : "Pilih Semua"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-placeholder" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-5">No. Rumah</th>
                  <th className="py-4 px-5">Tipe Hunian</th>
                  <th className="py-4 px-5">Pemilik / Pengelola / KK</th>
                  <th className="py-4 px-5">Token QR</th>
                  <th className="py-4 px-5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                {filteredDwellings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-secondary-text font-medium">
                      Tidak ada data hunian yang cocok dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredDwellings.map((d) => {
                    const isSelected = selectedIds.includes(d.id);
                    const badge = getBadgeStyle(d.type);
                    const BadgeIcon = badge.icon;
                    const ownerDisplay =
                      d.propertyName || d.ownerName || d.familyHeadName || "Belum Terdaftar";

                    return (
                      <tr
                        key={d.id}
                        className={`hover:bg-gray-sidebar-hover/60 transition ${
                          isSelected ? "bg-primary-100/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(d.id)}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-placeholder hover:text-gray-secondary-text transition-colors" />
                            )}
                          </button>
                        </td>

                        {/* Alamat */}
                        <td className="py-4 px-5 font-bold text-gray-heading-main">
                          Blok {d.blockNumber} No. {d.houseNumber}
                        </td>

                        {/* Tipe Badge */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <BadgeIcon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Pemilik/Pengelola */}
                        <td className="py-4 px-5 font-medium text-gray-body-text-btn">
                          {ownerDisplay}
                        </td>

                        {/* Token QR */}
                        <td className="py-4 px-5 font-mono text-xs text-gray-secondary-text">
                          {d.qrToken}
                        </td>

                        {/* Aksi Satuan */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Icon Button Unduh PNG */}
                            <button
                              type="button"
                              onClick={() => handleSingleDownload(d)}
                              className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg transition cursor-pointer"
                              title={`Unduh PNG - Blok ${d.blockNumber} No. ${d.houseNumber}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Icon Button Print */}
                            <button
                              type="button"
                              onClick={() => handleSinglePrint(d)}
                              className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg transition cursor-pointer"
                              title={`Cetak QR - Blok ${d.blockNumber} No. ${d.houseNumber}`}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* OFF-SCREEN HIDDEN STICKER CARDS FOR FULL PNG DOWNLOAD */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0">
        {dwellings.map((d) => (
          <div key={`sticker-${d.id}`} className="p-4 bg-white">
            <QrCodePrintCanvas
              id={`dwelling-sticker-card-${d.id}`}
              title={title || `STIKER PINTU — BLOK ${d.blockNumber} NO. ${d.houseNumber}`}
              subtitle={subtitle}
              qrUrl={getDwellingQrUrl(d.qrToken)}
              template={template}
              dwellingLabel={`Blok ${d.blockNumber} No. ${d.houseNumber}`}
            />
          </div>
        ))}
      </div>

      {/* PRINT CONTAINER FOR BATCH / SINGLE PRINT */}
      <div className="hidden print:block">
        {singlePrintDwelling ? (
          <div className="flex justify-center p-4">
            <QrCodePrintCanvas
              title={
                title ||
                `STIKER PINTU — BLOK ${singlePrintDwelling.blockNumber} NO. ${singlePrintDwelling.houseNumber}`
              }
              subtitle={subtitle}
              qrUrl={getDwellingQrUrl(singlePrintDwelling.qrToken)}
              template={template}
              dwellingLabel={`Blok ${singlePrintDwelling.blockNumber} No. ${singlePrintDwelling.houseNumber}`}
            />
          </div>
        ) : template === "a4_poster" ? (
          <div className="space-y-8">
            {selectedDwellings.map((d) => (
              <div key={d.id} className="break-after-page flex justify-center p-4">
                <QrCodePrintCanvas
                  title={
                    title ||
                    `STIKER PINTU — BLOK ${d.blockNumber} NO. ${d.houseNumber}`
                  }
                  subtitle={subtitle}
                  qrUrl={getDwellingQrUrl(d.qrToken)}
                  template={template}
                  dwellingLabel={`Blok ${d.blockNumber} No. ${d.houseNumber}`}
                />
              </div>
            ))}
          </div>
        ) : (
          /* GRID LAYOUT 2 KOLOM (SEPERTI DI SCREENSHOT USER) */
          <div className="grid grid-cols-2 gap-4 p-2 w-full">
            {selectedDwellings.map((d) => (
              <div key={d.id} className="flex justify-center items-center break-inside-avoid py-2">
                <QrCodePrintCanvas
                  title={
                    title ||
                    `STIKER PINTU — BLOK ${d.blockNumber} NO. ${d.houseNumber}`
                  }
                  subtitle={subtitle}
                  qrUrl={getDwellingQrUrl(d.qrToken)}
                  template={template}
                  dwellingLabel={`Blok ${d.blockNumber} No. ${d.houseNumber}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
