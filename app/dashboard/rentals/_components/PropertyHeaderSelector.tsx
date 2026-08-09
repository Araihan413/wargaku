import React from "react";
import { Building2, QrCode, Home, Users, CheckCircle2 } from "lucide-react";
import { PropertyDetail } from "../types";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface PropertyHeaderSelectorProps {
  properties: PropertyDetail[];
  selectedProperty: PropertyDetail | null;
  onSelectProperty: (property: PropertyDetail) => void;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  onOpenQrModal: () => void;
}

export const PropertyHeaderSelector: React.FC<PropertyHeaderSelectorProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  totalRooms,
  occupiedRooms,
  vacantRooms,
  onOpenQrModal,
}) => {
  if (!selectedProperty) return null;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const propertyOptions: SelectOption[] = properties.map((p) => ({
    value: String(p.id),
    label: `${p.name} (Blok ${p.blockNumber} No. ${p.houseNumber})`,
  }));

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        {/* Properti Selector / Title */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            {properties.length > 1 ? (
              <div className="w-64">
                <CustomSelect
                  value={String(selectedProperty.id)}
                  onChange={(val) => {
                    const found = properties.find((p) => p.id === Number(val));
                    if (found) onSelectProperty(found);
                  }}
                  options={propertyOptions}
                />
              </div>
            ) : (
              <h1 className="text-xl font-extrabold text-gray-heading-main">{selectedProperty.name}</h1>
            )}
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Alamat: Blok {selectedProperty.blockNumber} No. {selectedProperty.houseNumber} ({selectedProperty.type})
            </p>
          </div>
        </div>

        {/* Action Button: QR Code Modal */}
        <button
          type="button"
          onClick={onOpenQrModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-sidebar-hover border border-gray-border px-4 py-2 text-xs font-bold text-gray-heading-main hover:bg-gray-border/60 hover:text-primary transition-all cursor-pointer self-start sm:self-auto"
        >
          <QrCode className="h-4 w-4 text-primary" />
          <span>QR Code Properti</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-sidebar-hover/30 border border-gray-border">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-secondary-text uppercase">Total Unit/Kamar</span>
            <div className="text-lg font-bold text-gray-heading-main">{totalRooms} Kamar</div>
          </div>
          <Home className="h-5 w-5 text-gray-placeholder" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Kamar Terisi</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-900">{occupiedRooms} Kamar</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                {occupancyRate}%
              </span>
            </div>
          </div>
          <Users className="h-5 w-5 text-emerald-600" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Kamar Kosong</span>
            <div className="text-lg font-bold text-amber-900">{vacantRooms} Unit Siap Huni</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-amber-600" />
        </div>
      </div>
    </div>
  );
};
