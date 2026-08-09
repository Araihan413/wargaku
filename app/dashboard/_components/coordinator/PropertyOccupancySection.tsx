import React from "react";
import Link from "next/link";
import { Building2, ChevronRight, Home, Users } from "lucide-react";
import { PropertyOccupancyItem } from "./types";

interface PropertyOccupancySectionProps {
  properties: PropertyOccupancyItem[];
}

export const PropertyOccupancySection: React.FC<PropertyOccupancySectionProps> = ({ properties = [] }) => {
  const propertyList = Array.isArray(properties) ? properties : [];

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-border pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-heading-main flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Okupansi Properti Sewa yang Dikelola</span>
          </h2>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Status keterisian unit/kamar di tiap tempat kos dan kontrakan.
          </p>
        </div>
        <Link
          href="/dashboard/rentals"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-900 transition-colors"
        >
          <span>Kelola Unit & Denah</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {propertyList.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-placeholder">
          Belum ada properti sewa yang ditugaskan kepada Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propertyList.map((p) => {
            const isFull = p.vacantRooms === 0 && p.totalRooms > 0;

            return (
              <div
                key={p.id}
                className="border border-gray-border rounded-xl p-4 bg-gray-sidebar-hover/20 hover:bg-gray-sidebar-hover/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-heading-main">{p.name}</h3>
                    <p className="text-xs text-gray-secondary-text mt-0.5">{p.address}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isFull
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : p.vacantRooms > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {isFull ? "Penuh" : `${p.vacantRooms} Kamar Kosong`}
                  </span>
                </div>

                {/* Progress Bar Okupansi */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-secondary-text">Tingkat Okupansi</span>
                    <span className="font-bold text-gray-heading-main">{p.occupancyRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-border/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        p.occupancyRate >= 90
                          ? "bg-purple-500"
                          : p.occupancyRate >= 50
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(p.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-border/50 text-gray-secondary-text">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Terisi: <strong className="text-gray-heading-main">{p.occupiedRooms}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-amber-500" /> Kosong: <strong className="text-gray-heading-main">{p.vacantRooms}</strong>
                  </span>
                  <span>
                    Total: <strong className="text-gray-heading-main">{p.totalRooms}</strong> Kamar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
