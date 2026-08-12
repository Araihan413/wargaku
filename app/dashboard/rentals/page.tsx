"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { PropertyHeaderSelector } from "./_components/PropertyHeaderSelector";
import { VisualRoomGrid } from "./_components/VisualRoomGrid";
import { RoomDetailDrawer } from "./_components/RoomDetailDrawer";
import { PropertyQrModal } from "./_components/PropertyQrModal";
import { PropertyDetail, RoomGridItem, ActiveTenantInfo } from "./types";
import { CheckInModal } from "../my-properties/[id]/_components/CheckInModal";
import { CheckOutModal } from "../my-properties/[id]/_components/CheckOutModal";
import { EditResidentModal } from "../my-properties/[id]/_components/EditResidentModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function RentalsPage() {
  return (
    <PermissionGuard requiredPermission="manage-boarding">
      <RentalsContent />
    </PermissionGuard>
  );
}

function RentalsContent() {
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetail | null>(null);
  const [rooms, setRooms] = useState<RoomGridItem[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected room for slide-over drawer
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInInitialRoom] = useState<string>("");
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
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      setError(null);
      try {
        const res = await fetch("/api/rentals");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Gagal mengambil data properti sewa");
        }
        const data = await res.json();
        
        // API /api/rentals returns { data: [...], total: number }
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
            contactPerson: p.contactPerson,
            phone: p.phone,
            notes: p.notes,
            coordinatorUserId: p.coordinatorUserId,
            ownerUserId: p.dwelling?.ownerUserId,
            ownerName: p.dwelling?.ownerName,
          }));
          setProperties(mapped);
          setSelectedProperty(mapped[0]);
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
    };

    fetchProperties();
  }, []);

  // 2. Fetch rooms & residents for the selected property
  const fetchRooms = useCallback(async (propertyId: number | string) => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch(`/api/rentals/${propertyId}/rooms`);
      if (!res.ok) throw new Error("Gagal mengambil data kamar properti");
      const data = await res.json();
      const fetchedRooms: RoomGridItem[] = Array.isArray(data) ? data : (data.rooms || []);
      setRooms(fetchedRooms);
      // If the drawer is open but the selected room no longer exists, close it
      setSelectedRoomNumber((prev) => {
        if (prev && fetchedRooms.length > 0 && !fetchedRooms.some((r) => r.roomNumber === prev)) {
          setIsDrawerOpen(false);
          return null;
        }
        return prev;
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memuat data kamar");
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;

    let cancelled = false;

    const run = async () => {
      setIsLoadingRooms(true);
      try {
        const res = await fetch(`/api/rentals/${selectedProperty.id}/rooms`);
        if (!res.ok) throw new Error("Gagal mengambil data kamar properti");
        const data = await res.json();
        const fetchedRooms: RoomGridItem[] = Array.isArray(data) ? data : (data.rooms || []);
        if (!cancelled) {
          setRooms(fetchedRooms);
          setSelectedRoomNumber((prev) => {
            if (prev && fetchedRooms.length > 0 && !fetchedRooms.some((r) => r.roomNumber === prev)) {
              setIsDrawerOpen(false);
              return null;
            }
            return prev;
          });
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) toast.error(err.message || "Gagal memuat data kamar");
      } finally {
        if (!cancelled) setIsLoadingRooms(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedProperty]);



  // Derived Statistics
  const totalRooms = selectedProperty?.totalRooms || rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status !== "vacant").length;
  const vacantRooms = Math.max(totalRooms - occupiedRooms, 0);

  // Selected Room for Drawer
  const selectedRoomObj = rooms.find((r) => r.roomNumber === selectedRoomNumber) || null;

  // Drawer handlers
  const handleSelectRoom = (room: RoomGridItem) => {
    setSelectedRoomNumber(room.roomNumber);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRoomNumber(null);
  };

  // Check-Out Handlers
  const handleOpenCheckOut = useCallback((tenant: ActiveTenantInfo) => {
    handleCloseDrawer();
    setTargetCheckOutTenant(tenant);
    setIsCheckOutOpen(true);
  }, []);

  // Edit Handlers
  const handleOpenEdit = (tenant: ActiveTenantInfo) => {
    handleCloseDrawer();
    setTargetEditTenant(tenant);
    setIsEditOpen(true);
  };

  // Resubmit Handler
  const handleOpenResubmit = useCallback((tenant: ActiveTenantInfo) => {
    handleCloseDrawer();
    setTargetResubmitTenant(tenant);
    setIsResubmitConfirmOpen(true);
  }, []);

  const executeResubmit = async () => {
    if (!targetResubmitTenant) return;
    setIsResubmitting(true);
    const toastId = toast.loading("Mengirim ulang verifikasi...");
    try {
      const res = await fetch(`/api/rental-residents/${targetResubmitTenant.id}/resubmit`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Verifikasi berhasil diajukan ulang", { id: toastId });
        setIsResubmitConfirmOpen(false);
        setTargetResubmitTenant(null);
        if (selectedProperty) fetchRooms(selectedProperty.id);
      } else {
        toast.error(data.error || "Gagal mengirim ulang verifikasi", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi", { id: toastId });
    } finally {
      setIsResubmitting(false);
    }
  };

  // Loading State
  if (isLoadingProperties) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-10 w-64 rounded-xl bg-gray-border/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-card border border-gray-border p-4 shadow-xs" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-gray-card border border-gray-border shadow-xs" />
      </div>
    );
  }

  // Error / No Properties State (Koordinator belum ditugaskan kos)
  if (error || properties.length === 0) {
    return (
      <div className="flex min-h-120 flex-col items-center justify-center rounded-2xl border border-gray-border bg-gray-card p-8 text-center shadow-sm space-y-6">
        <div className="rounded-full bg-amber-50 p-5 text-amber-600 border border-amber-200 shadow-sm">
          <Building2 className="h-12 w-12" />
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-heading-main">
            Belum Ada Tempat Kos yang Ditugaskan
          </h2>
          <p className="text-xs text-gray-secondary-text leading-relaxed">
            {error ||
              "Akun Anda telah aktif sebagai Koordinator Properti Sewa, namun saat ini belum ada tempat kos atau kontrakan yang ditugaskan kepada Anda oleh Pemilik Kos atau Pengurus RT."}
          </p>
        </div>

        {/* Informative Guidance Card */}
        <div className="max-w-md w-full rounded-xl border border-gray-border bg-gray-sidebar-hover/40 p-4 text-left space-y-2 text-xs">
          <div className="font-bold text-gray-heading-main flex items-center gap-1.5">
            <span>💡 Skenario Penugasan Pengelola Kos:</span>
          </div>
          <ul className="space-y-1.5 text-gray-secondary-text list-disc list-inside text-[11px]">
            <li>
              <strong>Pemilik Kos / RT</strong> mendaftarkan properti dan memilih akun Anda sebagai <em>Koordinator / Caretaker</em>.
            </li>
            <li>
              Setelah penugasan dilakukan, denah kamar, status huni, serta antrean verifikasi penyewa baru akan <strong>otomatis muncul di halaman ini</strong>.
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-sidebar-hover border border-gray-border px-4 py-2 text-xs font-bold text-gray-heading-main hover:bg-gray-border/60 transition-all cursor-pointer"
          >
            <span>Cek Ulang Status</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Selector & Summary */}
      <PropertyHeaderSelector
        properties={properties}
        selectedProperty={selectedProperty}
        onSelectProperty={(prop) => {
          setSelectedProperty(prop);
          handleCloseDrawer();
        }}
        totalRooms={totalRooms}
        occupiedRooms={occupiedRooms}
        vacantRooms={vacantRooms}
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* Visual Room Grid */}
      {isLoadingRooms ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <VisualRoomGrid
          rooms={rooms}
          onSelectRoom={handleSelectRoom}
          selectedRoomNumber={selectedRoomNumber}
        />
      )}

      {/* Slide-Over Drawer Detail Kamar */}
      <RoomDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        room={selectedRoomObj}
        propertyId={selectedProperty?.id || 0}
        onOpenCheckIn={() => {
          handleCloseDrawer();
          setIsCheckInOpen(true);
        }}
        onOpenEdit={handleOpenEdit}
        onOpenCheckOut={handleOpenCheckOut}
        onOpenResubmit={handleOpenResubmit}
        onOpenDelete={(res) => {
          handleCloseDrawer();
          setTargetDeleteTenant(res);
          setIsDeleteConfirmOpen(true);
        }}
      />

      {/* Modal QR Code Properti */}
      <PropertyQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        property={selectedProperty}
      />

      {/* Modal Check-In Penyewa Baru */}
      {selectedProperty && (
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          onSuccess={() => {
            fetchRooms(selectedProperty.id);
            toast.success("Penghuni baru berhasil didaftarkan.");
          }}
          propertyId={selectedProperty.id}
          roomList={rooms.map((r) => r.roomNumber)}
          initialRoom={checkInInitialRoom}
        />
      )}

      {/* Modal Check-Out Penyewa */}
      {isCheckOutOpen && (
        <CheckOutModal
          isOpen={isCheckOutOpen}
          onClose={() => {
            setIsCheckOutOpen(false);
            setTargetCheckOutTenant(null);
          }}
          onSuccess={() => {
            if (selectedProperty) fetchRooms(selectedProperty.id);
          }}
          resident={targetCheckOutTenant}
        />
      )}

      {/* Modal Edit Data Penyewa */}
      {isEditOpen && (
        <EditResidentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setTargetEditTenant(null);
          }}
          onSuccess={() => {
            if (selectedProperty) fetchRooms(selectedProperty.id);
          }}
          resident={targetEditTenant}
          roomList={rooms.map((r) => r.roomNumber)}
        />
      )}

      {/* Confirm Modal Resubmit */}
      <ConfirmModal
        isOpen={isResubmitConfirmOpen}
        onClose={() => {
          setIsResubmitConfirmOpen(false);
          setTargetResubmitTenant(null);
        }}
        onConfirm={executeResubmit}
        title="Kirim Ulang Verifikasi"
        description={`Apakah Anda yakin ingin mengirim ulang verifikasi untuk "${targetResubmitTenant?.name}" ke RT? Pastikan data penyewa sudah diperbaiki.`}
        confirmText="Ya, Kirim Ulang"
        cancelText="Batal"
        variant="primary"
        isLoading={isResubmitting}
      />

      {/* Modal Confirm Delete */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTargetDeleteTenant(null);
        }}
        onConfirm={async () => {
          if (!targetDeleteTenant) return;
          setIsDeleting(true);
          const toastId = toast.loading("Menghapus data penyewa...");
          try {
            const res = await fetch(`/api/rental-residents/${targetDeleteTenant.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
              toast.success("Data penyewa berhasil dihapus. Kamar kembali kosong.", { id: toastId });
              setIsDeleteConfirmOpen(false);
              setTargetDeleteTenant(null);
              if (selectedProperty) fetchRooms(selectedProperty.id);
            } else {
              toast.error(data.error || "Gagal menghapus data penyewa", { id: toastId });
            }
          } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan koneksi", { id: toastId });
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Hapus Data Penyewa"
        description={`Apakah Anda yakin ingin membatalkan/menghapus secara permanen pendaftaran penyewa ${targetDeleteTenant?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
