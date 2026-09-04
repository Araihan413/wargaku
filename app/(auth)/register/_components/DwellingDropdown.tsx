import React from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { MapPin } from "lucide-react";

interface DwellingOption {
  id: number;
  label: string;
}

interface DwellingDropdownProps {
  dwellingsList: DwellingOption[];
  dwellingId: string;
  onSelect: (id: string) => void;
  error?: string;
}

export const DwellingDropdown: React.FC<DwellingDropdownProps> = ({
  dwellingsList,
  dwellingId,
  onSelect,
  error,
}) => {
  const options = dwellingsList.map((d) => ({
    value: String(d.id),
    label: d.label,
    icon: MapPin,
  }));

  return (
    <div className="space-y-1">
      <CustomSelect
        label="Alamat Rumah Tinggal"
        required={true}
        value={dwellingId || ""}
        onChange={onSelect}
        options={options}
        placeholder="Pilih alamat rumah terdaftar..."
        searchPlaceholder="Cari nomor rumah / blok..."
        emptyText="Tidak ada hunian terdaftar"
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
};
