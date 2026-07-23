"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon asset paths in Next.js
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src || markerIcon,
  iconRetinaUrl: markerIcon2x.src || markerIcon2x,
  shadowUrl: markerShadow.src || markerShadow,
});

interface FamilyMember {
  id: number;
  name: string;
  nik: string;
  relationship: string;
  phone: string;
  gender: string;
}

interface Family {
  id: number;
  familyNumber: string;
  headName: string;
  unitNumber: string | null;
  members: FamilyMember[];
}

interface RentalResident {
  id: number;
  name: string;
  nik: string;
  phone: string;
  roomNumber: string | null;
  originAddress: string | null;
}

interface RentalProperty {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  residents: RentalResident[];
}

interface Dwelling {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: "permanen" | "kos" | "homestay";
  notes: string | null;
  latitude: string | null;
  longitude: string | null;
  families: Family[];
  rentalProperties: RentalProperty[];
}

interface MapComponentProps {
  dwellings: Dwelling[];
  selectedDwellingId: number | null;
  onSelectDwelling: (id: number) => void;
}

// Controller component to pan the map viewport programmatically
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 18, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({
  dwellings,
  selectedDwellingId,
  onSelectDwelling,
}: MapComponentProps) {
  // Only plot dwellings that have valid coordinates
  const validDwellings = dwellings.filter(
    (d) => d.latitude !== null && d.longitude !== null
  );

  // Default coordinate center (fallback to Jakarta, Indonesia if no dwellings)
  const defaultCenter: [number, number] = [-6.200000, 106.816666];

  // Find the selected dwelling's coordinates to focus map on it
  const selectedDwelling = validDwellings.find((d) => d.id === selectedDwellingId);
  const mapCenter: [number, number] | null = selectedDwelling
    ? [Number(selectedDwelling.latitude), Number(selectedDwelling.longitude)]
    : validDwellings.length > 0
    ? [Number(validDwellings[0].latitude), Number(validDwellings[0].longitude)]
    : defaultCenter;

  const getDwellingTypeLabel = (type: string) => {
    switch (type) {
      case "permanen":
        return "Rumah Tinggal Tetap";
      case "kos":
        return "Kos / Kontrakan";
      case "homestay":
        return "Homestay / Penginapan";
      default:
        return type;
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-border shadow-inner relative z-0">
      <MapContainer
        center={mapCenter || defaultCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={selectedDwelling ? mapCenter : null} />

        {validDwellings.map((dwelling) => {
          const lat = Number(dwelling.latitude);
          const lng = Number(dwelling.longitude);

          return (
            <Marker
              key={dwelling.id}
              position={[lat, lng]}
              eventHandlers={{
                click: () => onSelectDwelling(dwelling.id),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 min-w-55">
                  <div className="border-b border-gray-border pb-1.5">
                    <h4 className="text-xs font-bold text-gray-heading-main">
                      Blok {dwelling.blockNumber} No. {dwelling.houseNumber}
                    </h4>
                    <span className="inline-block px-1.5 py-0.5 mt-1 rounded bg-primary/10 text-primary text-[9px] font-semibold uppercase">
                      {getDwellingTypeLabel(dwelling.type)}
                    </span>
                  </div>

                  {dwelling.type === "permanen" ? (
                    <div className="space-y-2 max-h-37.5 overflow-y-auto">
                      {dwelling.families.length === 0 ? (
                        <p className="text-[10px] text-gray-placeholder">Belum dihuni oleh KK terdaftar</p>
                      ) : (
                        dwelling.families.map((fam) => (
                          <div key={fam.id} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-secondary-text">
                              KK: {fam.headName} ({fam.members.length} Anggota)
                            </p>
                            <ul className="list-disc list-inside text-[9px] text-gray-body-text-btn space-y-0.5 pl-1">
                              {fam.members.map((m) => (
                                <li key={m.id}>
                                  {m.name} ({m.relationship.replace("_", " ")})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-37.5 overflow-y-auto">
                      {dwelling.rentalProperties.map((prop) => (
                        <div key={prop.id} className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-secondary-text">
                            {prop.name}
                          </p>
                          {prop.residents.length === 0 ? (
                            <p className="text-[9px] text-gray-placeholder">Tidak ada penyewa aktif</p>
                          ) : (
                            <ul className="list-disc list-inside text-[9px] text-gray-body-text-btn space-y-0.5 pl-1">
                              {prop.residents.map((r) => (
                                <li key={r.id}>
                                  {r.name} {r.roomNumber ? `(Kamar ${r.roomNumber})` : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      {dwelling.rentalProperties.length === 0 && (
                        <p className="text-[10px] text-gray-placeholder">Kos/Kontrakan belum didaftarkan</p>
                      )}
                    </div>
                  )}

                  {dwelling.notes && (
                    <div className="border-t border-gray-border pt-1.5">
                      <p className="text-[9px] text-gray-placeholder italic">
                        Catatan: {dwelling.notes}
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
