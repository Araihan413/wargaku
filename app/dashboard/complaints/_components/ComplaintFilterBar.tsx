"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";

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
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Cari kode tracking (LAP-...), nama, WhatsApp, atau isi aduan..."
          containerClassName="flex-1"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <CustomSelect
              value={category}
              onChange={onCategoryChange}
              options={categoryOptions}
              placeholder="Pilih Kategori"
            />
          </div>

          <div className="w-48">
            <CustomSelect
              value={status}
              onChange={onStatusChange}
              options={statusOptions}
              placeholder="Pilih Status"
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
