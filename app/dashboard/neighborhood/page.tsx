"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import { Loader2, Search, MapPin, MapPinOff, Home, Phone, Users, Info, Shield, HelpCircle } from "lucide-react";
import { toast } from "sonner";

// Load MapComponent dynamically without SSR to avoid 'window is not defined' Leaflet error
const MapComponent = dynamic(
  () => import("./_components/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-100 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-card border border-gray-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-gray-placeholder">Memuat Peta Interaktif...</span>
      </div>
    ),
  }
);

interface FamilyMember {
  id: number;
  name: string;
  nik: string;
  relationship: string;
  phone: string;
  gender: string;
  occupation: string | null;
  educationLevel: string | null;
}

interface Family {
  id: number;
  familyNumber: string;
  headName: string;
  unitNumber: string | null;
  verificationStatus: string;
  members: FamilyMember[];
}

interface RentalResident {
  id: number;
  name: string;
  nik: string;
  phone: string;
  roomNumber: string | null;
  originAddress: string | null;
  occupation: string | null;
  educationLevel: string | null;
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

export default function NeighborhoodPage() {
  const { isVerified, isLoading: isAuthLoading } = useFamilyVerification();
  const [dwellings, setDwellings] = useState<Dwelling[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDwellingId, setSelectedDwellingId] = useState<number | null>(null);

  // Fetch neighborhood data
  useEffect(() => {
    if (isVerified) {
      const fetchData = async () => {
        try {
          const res = await fetch("/api/neighborhood");
          if (!res.ok) throw new Error("Gagal mengambil data tetangga");
          const data = await res.json();
          setDwellings(data);
          
          // Select the first dwelling with valid coordinates by default
          const defaultSelect = data.find((d: Dwelling) => d.latitude && d.longitude);
          if (defaultSelect) {
            setSelectedDwellingId(defaultSelect.id);
          } else if (data.length > 0) {
            setSelectedDwellingId(data[0].id);
          }
        } catch (error) {
          console.error(error);
          toast.error("Terjadi kesalahan mengambil data lingkungan");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isVerified]);

  if (isAuthLoading || (isVerified && isLoadingData)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Memuat Data Peta & Tetangga...</span>
      </div>
    );
  }

  // Double check feature gate
  if (!isVerified) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center p-6">
        <div className="p-4 bg-error/10 rounded-full text-error mb-4">
          <Shield className="h-10 w-10" />
        </div>
        <h3 className="text-base font-bold text-gray-heading-main mb-1">Akses Terkunci</h3>
        <p className="text-xs text-gray-secondary-text max-w-sm">
          Halaman Peta Hunian & Tetangga hanya dapat diakses setelah akun Keluarga Anda diverifikasi oleh Ketua RT.
        </p>
      </div>
    );
  }

  // Filter dwellings based on search query (either house details, resident names, or head names)
  const filteredDwellings = dwellings.filter((dwelling) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Match block or house number
    const blockMatch = dwelling.blockNumber.toLowerCase().includes(query);
    const houseMatch = dwelling.houseNumber.toLowerCase().includes(query);
    const addressMatch = `blok ${dwelling.blockNumber} no. ${dwelling.houseNumber}`.toLowerCase().includes(query);

    // Match family members
    const familyMatch = dwelling.families.some((fam) => {
      const headMatch = fam.headName.toLowerCase().includes(query);
      const memberMatch = fam.members.some((m) => m.name.toLowerCase().includes(query));
      return headMatch || memberMatch;
    });

    // Match rental residents
    const rentalMatch = dwelling.rentalProperties.some((prop) => {
      return prop.residents.some((res) => res.name.toLowerCase().includes(query));
    });

    return blockMatch || houseMatch || addressMatch || familyMatch || rentalMatch;
  });

  const selectedDwelling = dwellings.find((d) => d.id === selectedDwellingId);
  const hasCoordinates = selectedDwelling?.latitude && selectedDwelling?.longitude;

  const getDwellingTypeLabel = (type: string) => {
    switch (type) {
      case "permanen":
        return "Permanen (Rumah Tinggal)";
      case "kos":
        return "Kos / Kontrakan Sewa";
      case "homestay":
        return "Homestay (Sewa Harian)";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-heading-main">Peta Hunian & Tetangga</h1>
        <p className="text-xs sm:text-sm text-gray-secondary-text">
          Telusuri alamat hunian dan daftar tetangga di wilayah RT Anda secara interaktif.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Search and Resident List */}
        <div className="space-y-4 lg:col-span-1 flex flex-col h-[75vh]">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-placeholder" />
            <input
              type="text"
              placeholder="Cari nama warga atau nomor rumah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-card border border-gray-border rounded-2xl text-xs text-gray-heading-main placeholder-gray-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* Dwellings List */}
          <div className="flex-1 overflow-y-auto space-y-2 border border-gray-border/80 rounded-2xl p-2 bg-gray-sidebar-hover/10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredDwellings.length === 0 ? (
              <div className="text-center py-10">
                <HelpCircle className="h-8 w-8 text-gray-placeholder mx-auto mb-2" />
                <p className="text-xs text-gray-placeholder font-medium">Tetangga tidak ditemukan</p>
              </div>
            ) : (
              filteredDwellings.map((dwelling) => {
                const isSelected = dwelling.id === selectedDwellingId;
                const hasCoords = dwelling.latitude && dwelling.longitude;

                // Find the main person's name to display as summary
                let displayResident = "Belum terdaftar";
                if (dwelling.type === "permanen" && dwelling.families.length > 0) {
                  displayResident = `KK: ${dwelling.families[0].headName}`;
                } else if (dwelling.type !== "permanen" && dwelling.rentalProperties.length > 0) {
                  const activeResidentsCount = dwelling.rentalProperties.reduce(
                    (sum, p) => sum + p.residents.length,
                    0
                  );
                  displayResident = `${dwelling.rentalProperties[0].name} (${activeResidentsCount} Penyewa)`;
                }

                return (
                  <button
                    key={dwelling.id}
                    onClick={() => setSelectedDwellingId(dwelling.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-gray-card border-gray-border hover:bg-gray-sidebar-hover"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-heading-main">
                        Blok {dwelling.blockNumber} No. {dwelling.houseNumber}
                      </h4>
                      <p className="text-[10px] text-gray-secondary-text font-medium">
                        {displayResident}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-gray-sidebar-hover text-[8px] font-semibold text-gray-secondary-text uppercase">
                        {dwelling.type}
                      </span>
                    </div>
                    {hasCoords ? (
                      <MapPin className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-gray-placeholder"}`} />
                    ) : (
                      <MapPinOff className="h-4 w-4 shrink-0 text-error/40" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Middle/Right columns: Map Viewer or Details */}
        <div className="lg:col-span-2">
          {/* Main Map Component Container */}
          <div className="h-112.5 w-full shrink-0">
            {selectedDwelling && hasCoordinates ? (
              <MapComponent
                dwellings={dwellings}
                selectedDwellingId={selectedDwellingId}
                onSelectDwelling={(id) => setSelectedDwellingId(id)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-card border border-gray-border rounded-2xl p-6 text-center shadow-sm">
                <div className="p-4 bg-gray-sidebar-hover/60 rounded-full text-gray-placeholder mb-3">
                  <MapPinOff className="h-10 w-10 text-error/60" />
                </div>
                <h3 className="text-sm font-bold text-gray-heading-main mb-1">Koordinat Lokasi Belum Dilengkapi</h3>
                <p className="text-[11px] text-gray-secondary-text max-w-xs">
                  Koordinat lintang & bujur untuk rumah **Blok {selectedDwelling?.blockNumber} No. {selectedDwelling?.houseNumber}** belum dimasukkan oleh Pengurus RT.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          {/* Resident Details Box */}
          {selectedDwelling && (
            <div className="bg-gray-card border border-gray-border rounded-2xl p-5 shadow-sm space-y-4 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-border mb-6">
              <div className="flex justify-between items-start border-b border-gray-border pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-heading-main">
                    Detail Hunian: Blok {selectedDwelling.blockNumber} No. {selectedDwelling.houseNumber}
                  </h3>
                  <span className="text-[10px] text-gray-secondary-text">
                    Tipe: {getDwellingTypeLabel(selectedDwelling.type)}
                  </span>
                </div>
                {selectedDwelling.notes && (
                  <div className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-lg max-w-xs">
                    <Info className="inline-block h-3.5 w-3.5 mr-1 align-text-bottom" />
                    {selectedDwelling.notes}
                  </div>
                )}
              </div>

              {selectedDwelling.type === "permanen" ? (
                <div className="space-y-4">
                  {selectedDwelling.families.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-placeholder">
                      Belum ada data warga terdaftar yang mendiami rumah ini.
                    </div>
                  ) : (
                    selectedDwelling.families.map((fam) => (
                      <div key={fam.id} className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <Users className="h-4 w-4" />
                          <span>Keluarga: {fam.headName}</span>
                          <span className="text-[10px] font-normal text-gray-secondary-text bg-gray-sidebar-hover/40 px-2 py-0.5 rounded">
                            No. KK: {fam.familyNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                          {fam.members.map((member) => (
                            <div
                              key={member.id}
                              className="p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/5 space-y-1.5 text-[11px]"
                            >
                              <div className="flex items-center justify-between border-b border-gray-border/40 pb-1">
                                <span className="font-bold text-gray-heading-main">{member.name}</span>
                                <span className="text-[9px] font-semibold text-gray-secondary-text px-1.5 py-0.5 rounded bg-gray-sidebar-hover uppercase">
                                  {member.relationship.replace("_", " ")}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-1 text-gray-secondary-text">
                                <span>NIK:</span>
                                <span className="font-mono text-right text-gray-heading-main">{member.nik}</span>
                                <span>Gender:</span>
                                <span className="text-right text-gray-heading-main">
                                  {member.gender === "L" ? "Laki-laki" : "Perempuan"}
                                </span>
                                <span>Pekerjaan:</span>
                                <span className="text-right text-gray-heading-main">{member.occupation || "-"}</span>
                                <span>No. HP:</span>
                                <span className="text-right text-gray-heading-main font-mono">{member.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDwelling.rentalProperties.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-placeholder">
                      Belum ada data unit kos/kontrakan didaftarkan.
                    </div>
                  ) : (
                    selectedDwelling.rentalProperties.map((prop) => (
                      <div key={prop.id} className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-primary">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>{prop.name}</span>
                          </div>
                          {prop.phone && (
                            <a
                              href={`https://wa.me/${prop.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-success hover:underline font-semibold"
                            >
                              <Phone className="h-3 w-3" />
                              Hubungi Pengelola: {prop.phone}
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                          {prop.residents.length === 0 ? (
                            <div className="col-span-2 text-center py-3 text-xs text-gray-placeholder">
                              Tidak ada penyewa aktif terdaftar.
                            </div>
                          ) : (
                            prop.residents.map((res) => (
                              <div
                                key={res.id}
                                className="p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/5 space-y-1.5 text-[11px]"
                              >
                                <div className="flex items-center justify-between border-b border-gray-border/40 pb-1">
                                  <span className="font-bold text-gray-heading-main">{res.name}</span>
                                  {res.roomNumber && (
                                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      Kamar: {res.roomNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-y-1 text-gray-secondary-text">
                                  <span>NIK:</span>
                                  <span className="font-mono text-right text-gray-heading-main">{res.nik}</span>
                                  <span>Pekerjaan:</span>
                                  <span className="text-right text-gray-heading-main">{res.occupation || "-"}</span>
                                  <span>No. HP:</span>
                                  <span className="text-right text-gray-heading-main font-mono">{res.phone}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
