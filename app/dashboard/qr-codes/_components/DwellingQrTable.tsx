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
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { DwellingOption } from "@/db/queries/qr-codes";
import { QrTemplateType, QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";

interface DwellingQrTableProps {
  dwellings: DwellingOption[];
  template: QrTemplateType;
  title: string;
  subtitle: string;
}

export const DwellingQrTable: React.FC<DwellingQrTableProps> = ({
  dwellings,
  template,
  title,
  subtitle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("semua");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Preview modal state for single/batch preview
  const [previewDwelling, setPreviewDwelling] = useState<DwellingOption | null>(null);

  // Filtered dwellings based on search & type filter
  const filteredDwellings = useMemo(() => {
    return dwellings.filter((d) => {
      // Filter type
      if (typeFilter !== "semua" && d.type !== typeFilter) {
        return false;
      }
      // Filter search
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
      // Unselect filtered items
      const filteredSet = new Set(filteredDwellings.map((d) => d.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      // Select all filtered items
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
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://wargaku.app";
    return `${origin}/scan-qr?token=${encodeURIComponent(qrToken)}`;
  };

  // Get selected dwelling objects
  const selectedDwellings = useMemo(() => {
    return dwellings.filter((d) => selectedIds.includes(d.id));
  }, [dwellings, selectedIds]);

  // Handle Batch Download PNGs
  const handleBatchDownload = async () => {
    if (selectedDwellings.length === 0) {
      toast.error("Pilih setidaknya 1 hunian untuk diunduh");
      return;
    }

    toast.info(`Mengunduh ${selectedDwellings.length} gambar QR Code...`);

    for (const d of selectedDwellings) {
      try {
        const qrUrl = getDwellingQrUrl(d.qrToken);
        const url = await QRCode.toDataURL(qrUrl, { width: 800, margin: 2 });
        const a = document.createElement("a");
        a.href = url;
        a.download = `QR_Hunian_Blok_${d.blockNumber}_No_${d.houseNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Small delay to prevent browser download throttling
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error("Error downloading QR:", err);
      }
    }

    toast.success(`${selectedDwellings.length} QR Code berhasil diunduh!`);
  };

  // Handle Batch Print
  const handleBatchPrint = () => {
    if (selectedDwellings.length === 0) {
      toast.error("Pilih setidaknya 1 hunian untuk dicetak");
      return;
    }
    window.print();
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              2. Cetak QR Hunian (Semua Tipe Hunian)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Pilih hunian dari daftar di bawah untuk mencetak stiker QR atau mengunduh file gambarnya secara bersamaan.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari blok, no rumah, pemilik..."
            className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-4 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Filter Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Dropdown Filter Tipe Hunian */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold cursor-pointer"
          >
            <option value="semua">Semua Tipe Hunian</option>
            <option value="permanen">Rumah Permanen</option>
            <option value="kos">Kos / Kontrakan</option>
            <option value="homestay">Homestay</option>
          </select>

          {/* Tombol Unduh Pilihan */}
          <button
            type="button"
            onClick={handleBatchDownload}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh ({selectedIds.length})</span>
          </button>

          {/* Tombol Cetak Pilihan */}
          <button
            type="button"
            onClick={handleBatchPrint}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Selected Items Status Banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold">
          <span>{selectedIds.length} hunian terpilih untuk diprint / diunduh.</span>
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
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-slate-600 hover:text-blue-600"
                    title={isAllSelected ? "Batal Pilih Semua" : "Pilih Semua"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Alamat / No. Rumah</th>
                <th className="p-3.5">Tipe Hunian</th>
                <th className="p-3.5">Pemilik / Pengelola / KK</th>
                <th className="p-3.5">Token QR</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredDwellings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
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
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(d.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Alamat */}
                      <td className="p-3.5 font-bold text-slate-900">
                        Blok {d.blockNumber} No. {d.houseNumber}
                      </td>

                      {/* Tipe Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Pemilik/Pengelola */}
                      <td className="p-3.5 font-semibold text-slate-700">
                        {ownerDisplay}
                      </td>

                      {/* Token QR */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {d.qrToken}
                      </td>

                      {/* Aksi Single Preview */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setPreviewDwelling(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          title="Pratinjau Stiker QR"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Pratinjau</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE PREVIEW MODAL */}
      {previewDwelling && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Pratinjau Stiker QR Code
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDwelling(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <QrCodePrintCanvas
                title={
                  title ||
                  `STIKER PINTU — BLOK ${previewDwelling.blockNumber} NO. ${previewDwelling.houseNumber}`
                }
                subtitle={subtitle}
                qrUrl={getDwellingQrUrl(previewDwelling.qrToken)}
                template={template}
                dwellingLabel={`Blok ${previewDwelling.blockNumber} No. ${previewDwelling.houseNumber}`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDwelling(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([previewDwelling.id]);
                  setPreviewDwelling(null);
                  setTimeout(() => window.print(), 300);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak QR Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY BATCH CONTAINER (Ditampilkan hanya saat print window terbuka) */}
      <div className="hidden print:block print:space-y-8">
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
    </div>
  );
};
