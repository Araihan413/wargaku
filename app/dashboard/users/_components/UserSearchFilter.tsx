import React from "react";
import { RoleItem } from "../types";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";

interface UserSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  roles: RoleItem[];
  setCurrentPage: (page: number) => void;
}

export const UserSearchFilter: React.FC<UserSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  roles,
  setCurrentPage,
}) => {
  const roleOptions: SelectOption[] = [
    { value: "", label: "Semua Peran" },
    ...roles.map((r) => ({
      value: r.id.toString(),
      label: r.name,
    })),
  ];

  const statusOptions: SelectOption[] = [
    { value: "", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "suspended", label: "Ditangguhkan" },
    { value: "pending", label: "Menunggu Verifikasi" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-card border border-gray-border rounded-2xl p-4 shadow-sm items-end">
      {/* Kolom Pencarian */}
      <div className="md:col-span-2">
        <SearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Cari berdasarkan nama atau email..."
          containerClassName="w-full"
        />
      </div>

      {/* Filter Peran */}
      <div>
        <CustomSelect
          value={selectedRole}
          onChange={(val) => {
            setSelectedRole(val);
            setCurrentPage(1);
          }}
          options={roleOptions}
          placeholder="Semua Peran"
        />
      </div>

      {/* Filter Status */}
      <div>
        <CustomSelect
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          options={statusOptions}
          placeholder="Semua Status"
        />
      </div>
    </div>
  );
};
