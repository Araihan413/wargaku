import React from "react";
import { Search } from "lucide-react";
import { RoleItem } from "../types";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

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
      <div className="relative md:col-span-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-placeholder" />
        </div>
        <input
          type="text"
          placeholder="Cari berdasarkan nama, email, atau NIK..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="block w-full rounded-xl border border-gray-border bg-gray-card py-2.5 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
