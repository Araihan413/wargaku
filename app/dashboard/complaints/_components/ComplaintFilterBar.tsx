"use client";

import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

interface ComplaintFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

export const ComplaintFilterBar: React.FC<ComplaintFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  onReset,
}) => {
  const categoryOptions = [
    { value: "all", label: "Semua Kategori" },
    { value: "Infrastruktur", label: "Infrastruktur" },
    { value: "Kebersihan", label: "Kebersihan" },
    { value: "Keamanan", label: "Keamanan" },
    { value: "Sosial", label: "Sosial" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "menunggu", label: "Menunggu Respon" },
    { value: "proses", label: "Sedang Diproses" },
    { value: "selesai", label: "Selesai Ditangani" },
    { value: "ditolak", label: "Laporan Ditolak" },
  ];

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-placeholder" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode tracking (LAP-...), nama, WhatsApp, atau isi aduan..."
            className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <CustomSelect
              value={category}
              onChange={onCategoryChange}
              options={categoryOptions}
              placeholder="Pilih Kategori"
              size="sm"
            />
          </div>

          <div className="w-48">
            <CustomSelect
              value={status}
              onChange={onStatusChange}
              options={statusOptions}
              placeholder="Pilih Status"
              size="sm"
            />
          </div>

          {(search || category !== "all" || status !== "all") && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main hover:bg-gray-divider transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
