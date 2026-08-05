import React from "react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";

interface KKSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedActive: string;
  setSelectedActive: (active: string) => void;
  setCurrentPage: (page: number) => void;
}

export const KKSearchFilter: React.FC<KKSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedActive,
  setSelectedActive,
  setCurrentPage,
}) => {
  const statusOptions: SelectOption[] = [
    { value: "", label: "Semua Status Verifikasi" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Terverifikasi" },
    { value: "rejected", label: "Ditolak" },
  ];

  const activeOptions: SelectOption[] = [
    { value: "true", label: "Hanya KK Aktif" },
    { value: "false", label: "Hanya KK Nonaktif" },
    { value: "", label: "Semua Status Keaktifan" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-card border border-gray-border rounded-2xl p-4 shadow-sm items-end">
      {/* Search Input */}
      <div className="md:col-span-2">
        <SearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Cari nomor KK atau nama Kepala Keluarga..."
          containerClassName="w-full"
        />
      </div>

      {/* Verification Status Filter */}
      <div>
        <CustomSelect
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          options={statusOptions}
          placeholder="Semua Status Verifikasi"
        />
      </div>

      {/* Active/Inactive Filter */}
      <div>
        <CustomSelect
          value={selectedActive}
          onChange={(val) => {
            setSelectedActive(val);
            setCurrentPage(1);
          }}
          options={activeOptions}
          placeholder="Hanya KK Aktif"
        />
      </div>
    </div>
  );
};
