"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Building2, Sliders, Check } from "lucide-react";
import { toast } from "sonner";
import { PropertyHeaderSelector } from "./_components/PropertyHeaderSelector";
import { ActiveTenantsTab } from "./_components/ActiveTenantsTab";
import { PropertyQrModal } from "./_components/PropertyQrModal";
import { RentalsSkeleton } from "./_components/RentalsSkeleton";
import { PropertyDetail, ActiveTenantInfo } from "./types";
import { CheckInModal } from "../my-properties/[id]/_components/CheckInModal";
import { CheckOutModal } from "../my-properties/[id]/_components/CheckOutModal";
import { EditResidentModal } from "../my-properties/[id]/_components/EditResidentModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function RentalsPage() {
  return (
    <PermissionGuard requiredPermission="manage-boarding">
      <Suspense fallback={<RentalsSkeleton />}>
        <RentalsContent />
      </Suspense>
    </PermissionGuard>
  );
}


function RentalsContent() {
  const searchParams = useSearchParams();
  const targetPropertyId = Number(searchParams.get("propertyId")) || null;


  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetail | null>(null);
  const [residents, setResidents] = useState<ActiveTenantInfo[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick edit capacity state
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [tempTotalRooms, setTempTotalRooms] = useState(0);
  const [tempOccupiedRooms, setTempOccupiedRooms] = useState(0);
  const [isSavingCapacity, setIsSavingCapacity] = useState(false);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [targetCheckOutTenant, setTargetCheckOutTenant] = useState<ActiveTenantInfo | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetEditTenant, setTargetEditTenant] = useState<ActiveTenantInfo | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [targetDeleteTenant, setTargetDeleteTenant] = useState<ActiveTenantInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isResubmitConfirmOpen, setIsResubmitConfirmOpen] = useState(false);
  const [targetResubmitTenant, setTargetResubmitTenant] = useState<ActiveTenantInfo | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // 1. Fetch managed properties on mount
  const fetchProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    setError(null);
    try {
      const res = await fetch("/api/rentals");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengambil data properti sewa");
      }
      const data = await res.json();
      
      const rows = Array.isArray(data) ? data : (data?.data ?? []);
      if (rows.length > 0) {
        const mapped: PropertyDetail[] = rows.map((p: any) => ({
          id: p.id,
          name: p.name,
          dwellingId: p.dwellingId,
          blockNumber: p.blockNumber || "-",
          houseNumber: p.houseNumber || "-",
          type: p.dwellingType || "kos",
          qrToken: p.qrToken || undefined,
          totalRooms: p.totalRooms || 0,
          occupiedRooms: p.occupiedRooms || 0,
          vacantRooms: p.vacantRooms || Math.max(0, (p.totalRooms || 0) - (p.occupiedRooms || 0)),
          contactPerson: p.contactPerson,
          phone: p.phone,
          notes: p.notes,
          coordinatorUserId: p.coordinatorUserId,
          ownerUserId: p.dwelling?.ownerUserId,
          ownerName: p.dwelling?.ownerName,
        }));
        setProperties(mapped);
        setSelectedProperty((prev) => {
          if (targetPropertyId && !isNaN(targetPropertyId)) {
            const match = mapped.find((m) => m.id === targetPropertyId);
            if (match) return match;
          }
          if (prev) {
            const updated = mapped.find((m) => m.id === prev.id);
            return updated || mapped[0];
          }
          return mapped[0];
        });
      } else {

        setProperties([]);
        setSelectedProperty(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoadingProperties(false);
    }
  }, [targetPropertyId]);


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProperties();
  }, [fetchProperties]);

  // 2. Fetch residents for the selected property
  const fetchResidents = useCallback(async (propertyId: number) => {
    setIsLoadingResidents(true);
    try {
      const res = await fetch(`/api/rentals/${propertyId}/residents?isActive=true`);
      if (!res.ok) throw new Error("Gagal mengambil data penyewa");
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data?.data ?? []);
      setResidents(rawList);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memuat data penyewa");
    } finally {
      setIsLoadingResidents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchResidents(selectedProperty.id);
      setTempTotalRooms(selectedProperty.totalRooms);
      setTempOccupiedRooms(selectedProperty.occupiedRooms);
      setIsEditingCapacity(false);
    }
  }, [selectedProperty, fetchResidents]);

  const handleSaveCapacity = async () => {
    if (!selectedProperty) return;
    if (tempTotalRooms < 0 || tempOccupiedRooms < 0) {
      toast.error("Jumlah kamar tidak boleh bernilai negatif");
      return;
    }
    if (tempOccupiedRooms > tempTotalRooms) {
      toast.error("Kamar terisi tidak boleh melebihi total kapasitas");
      return;
    }

    setIsSavingCapacity(true);
    try {
      const res = await fetch(`/api/rentals/${selectedProperty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalRooms: tempTotalRooms,
          occupiedRooms: tempOccupiedRooms,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memperbarui keterisian properti");
      }

      toast.success("Keterisian kamar berhasil diperbarui!");
      setIsEditingCapacity(false);
      await fetchProperties();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSavingCapacity(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!targetDeleteTenant) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rental-residents/${targetDeleteTenant.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menghapus kontrak");
      }
      toast.success("Kontrak penyewa berhasil dihapus");
      setIsDeleteConfirmOpen(false);
      setTargetDeleteTenant(null);
      if (selectedProperty) {
        fetchResidents(selectedProperty.id);
        fetchProperties();
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResubmitTenant = async () => {
    if (!targetResubmitTenant) return;
    setIsResubmitting(true);
    try {
      const res = await fetch(`/api/rental-residents/${targetResubmitTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "pending" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mengajukan ulang");
      }
      toast.success("Data penyewa berhasil diajukan ulang ke RT");
      setIsResubmitConfirmOpen(false);
      setTargetResubmitTenant(null);
      if (selectedProperty) {
        fetchResidents(selectedProperty.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengajukan ulang");
    } finally {
      setIsResubmitting(false);
    }
  };

  if (isLoadingProperties) {
    return <RentalsSkeleton />;
  }

  if (error || properties.length === 0) {
    return (
      <div className="mx-auto max-w-lg my-12 text-center p-8 bg-gray-card border border-gray-border rounded-3xl shadow-sm space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-heading-main">
            {error ? "Gagal Memuat Properti" : "Belum Ada Properti Sewa"}
          </h2>
          <p className="text-xs text-gray-secondary-text mt-1 max-w-sm mx-auto leading-relaxed">
            {error || "Belum ada kos atau kontrakan aktif yang terdaftar di lingkungan RT ini."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Selector Properti */}
      {selectedProperty && (
        <PropertyHeaderSelector
          properties={properties}
          selectedProperty={selectedProperty}
          onSelectProperty={setSelectedProperty}
          totalRooms={selectedProperty.totalRooms}
          occupiedRooms={selectedProperty.occupiedRooms}
          vacantRooms={selectedProperty.vacantRooms}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />
      )}

      {/* 2. Quick Edit Keterisian Kamar */}
      {selectedProperty && (
        <div className="rounded-2xl border border-gray-border bg-gray-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-heading-main">
                Pengaturan Cepat Keterisian Kamar
              </h3>
            </div>
            {!isEditingCapacity ? (
              <button
                type="button"
                onClick={() => {
                  setTempTotalRooms(selectedProperty.totalRooms);
                  setTempOccupiedRooms(selectedProperty.occupiedRooms);
                  setIsEditingCapacity(true);
                }}
                className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
              >
                Ubah Jumlah
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCapacity(false)}
                  className="px-2.5 py-1 text-xs font-bold text-gray-secondary-text hover:bg-gray-sidebar-hover rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCapacity}
                  disabled={isSavingCapacity}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-primary hover:bg-primary-900 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isSavingCapacity ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Simpan</span>
                </button>
              </div>
            )}
          </div>

          {isEditingCapacity && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-secondary-text">Total Kapasitas</label>
                <input
                  type="number"
                  min={0}
                  value={tempTotalRooms}
                  onChange={(e) => setTempTotalRooms(Number(e.target.value))}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-1.5 text-xs font-bold text-gray-heading-main focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-secondary-text">Kamar Terisi</label>
                <input
                  type="number"
                  min={0}
                  max={tempTotalRooms}
                  value={tempOccupiedRooms}
                  onChange={(e) => setTempOccupiedRooms(Number(e.target.value))}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-1.5 text-xs font-bold text-gray-heading-main focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-secondary-text">Kamar Kosong (Otomatis)</label>
                <div className="w-full bg-gray-sidebar-hover/50 border border-gray-border rounded-xl px-3 py-1.5 text-xs font-bold text-amber-600">
                  {Math.max(0, tempTotalRooms - tempOccupiedRooms)} Kamar
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Daftar Penyewa Aktif */}
      {isLoadingResidents ? (
        <div className="space-y-6">
          <div className="h-14 bg-gray-card rounded-2xl border border-gray-border animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-4 animate-pulse h-48"
              >
                <div className="flex items-start justify-between border-b border-gray-border/50 pb-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-sidebar-hover rounded-md" />
                    <div className="h-3 w-24 bg-gray-sidebar-hover/60 rounded-md" />
                  </div>
                  <div className="h-5 w-20 bg-gray-sidebar-hover rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-3.5 bg-gray-sidebar-hover/60 rounded-md" />
                  <div className="h-3.5 bg-gray-sidebar-hover/60 rounded-md" />
                  <div className="h-3.5 bg-gray-sidebar-hover/60 rounded-md" />
                  <div className="h-3.5 bg-gray-sidebar-hover/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActiveTenantsTab
          residents={residents}
          onOpenCheckIn={() => setIsCheckInOpen(true)}
          onOpenEdit={(r) => {
            setTargetEditTenant(r);
            setIsEditOpen(true);
          }}
          onOpenCheckOut={(r) => {
            setTargetCheckOutTenant(r);
            setIsCheckOutOpen(true);
          }}
          onOpenResubmit={(r) => {
            setTargetResubmitTenant(r);
            setIsResubmitConfirmOpen(true);
          }}
          onOpenDelete={(r) => {
            setTargetDeleteTenant(r);
            setIsDeleteConfirmOpen(true);
          }}
        />
      )}

      {/* QR Modal */}
      {selectedProperty && (
        <PropertyQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          property={selectedProperty}
        />
      )}

      {/* Check In Modal */}
      {selectedProperty && (
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          onSuccess={() => {
            fetchResidents(selectedProperty.id);
            fetchProperties();
          }}
          propertyId={selectedProperty.id}
        />
      )}

      {/* Check Out Modal */}
      <CheckOutModal
        isOpen={isCheckOutOpen}
        onClose={() => {
          setIsCheckOutOpen(false);
          setTargetCheckOutTenant(null);
        }}
        onSuccess={() => {
          if (selectedProperty) {
            fetchResidents(selectedProperty.id);
            fetchProperties();
          }
        }}
        resident={targetCheckOutTenant}
      />

      {/* Edit Resident Modal */}
      {targetEditTenant && selectedProperty && (
        <EditResidentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setTargetEditTenant(null);
          }}
          onSuccess={() => {
            fetchResidents(selectedProperty.id);
          }}
          resident={targetEditTenant as any}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTargetDeleteTenant(null);
        }}
        onConfirm={handleDeleteTenant}
        title="Hapus Kontrak Sewa"
        description={`Apakah Anda yakin ingin menghapus data kontrak penyewa ${targetDeleteTenant?.name || ""}? Tindakan ini akan menghapus data kontrak sewa secara permanen.`}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Resubmit Confirm Modal */}
      <ConfirmModal
        isOpen={isResubmitConfirmOpen}
        onClose={() => {
          setIsResubmitConfirmOpen(false);
          setTargetResubmitTenant(null);
        }}
        onConfirm={handleResubmitTenant}
        title="Kirim Ulang Verifikasi RT"
        description={`Ajukan kembali data penyewa ${targetResubmitTenant?.name || ""} ke antrean verifikasi pengurus RT?`}
        confirmText="Kirim Ulang"
        cancelText="Batal"
        isLoading={isResubmitting}
        variant="primary"
      />
    </div>
  );
}
