"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Users,
  Settings,
  History,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import { EditResidentModal } from "./_components/EditResidentModal";
import { CheckInModal } from "./_components/CheckInModal";
import { CheckOutModal } from "./_components/CheckOutModal";
import { ResidentsTab } from "./_components/ResidentsTab";
import { BusinessTab } from "./_components/BusinessTab";
import { HistoryTab } from "./_components/HistoryTab";
import { DetailResidentModal } from "./_components/DetailResidentModal";
import { PropertyDetails, RentalResidentItem } from "./types";

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const propertyId = Number(id);

  const { data: session } = authClient.useSession();
  const sessionUserId = session?.user?.id;
  const { isVerified, isLoading: isVerificationLoading } = useFamilyVerification(session?.user?.roleId);

  // States
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [activeResidents, setActiveResidents] = useState<RentalResidentItem[]>([]);
  const [inactiveResidents, setInactiveResidents] = useState<RentalResidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"residents" | "business" | "history">("residents");

  // Modals States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedResidentForCheckOut, setSelectedResidentForCheckOut] = useState<RentalResidentItem | null>(null);

  // Edit Resident Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedResidentForEdit, setSelectedResidentForEdit] = useState<RentalResidentItem | null>(null);

  // Detail Resident Modal States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedResidentForDetail, setSelectedResidentForDetail] = useState<RentalResidentItem | null>(null);

  // Deletion States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [residentIdToDelete, setResidentIdToDelete] = useState<number | null>(null);

  // Resubmit Verification States
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [residentIdToSend, setResidentIdToSend] = useState<number | null>(null);
  const [isSendingToRT, setIsSendingToRT] = useState(false);

  const handleDeleteResident = async () => {
    if (!residentIdToDelete) return;
    try {
      const res = await fetch(`/api/rental-residents/${residentIdToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Pendaftaran penyewa berhasil dihapus");
        fetchResidents();
        setIsDeleteConfirmOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus pendaftaran");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  const handleResubmitToRT = async () => {
    if (!residentIdToSend) return;
    setIsSendingToRT(true);
    try {
      const res = await fetch(`/api/rental-residents/${residentIdToSend}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "pending",
        }),
      });
      if (res.ok) {
        toast.success("Data berhasil dikirim ulang ke RT untuk verifikasi.");
        fetchResidents();
        setIsSendConfirmOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengirim data ke RT");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSendingToRT(false);
    }
  };

  const fetchProperty = useCallback(async () => {
    try {
      const res = await fetch(`/api/my-properties/${propertyId}`);
      if (res.ok) {
        const json = await res.json();
        setProperty(json);
        if (json.dwelling?.type === "homestay") {
          setActiveTab("business");
        }
      } else {
        toast.error("Gagal memuat detail properti");
        router.push("/dashboard/my-properties");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, router]);

  const fetchResidents = useCallback(async () => {
    try {
      // Active residents
      const activeRes = await fetch(`/api/rentals/${propertyId}/residents?isActive=true`);
      if (activeRes.ok) {
        const json = await activeRes.json();
        setActiveResidents(json.data || []);
      } else {
        const errJson = await activeRes.json().catch(() => ({}));
        console.error("Gagal memuat penghuni aktif:", errJson);
        toast.error(errJson.error || "Gagal memuat data penghuni aktif");
      }
      
      // Inactive residents history
      const inactiveRes = await fetch(`/api/rentals/${propertyId}/residents?isActive=false`);
      if (inactiveRes.ok) {
        const json = await inactiveRes.json();
        setInactiveResidents(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (sessionUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProperty();
      fetchResidents();
    }
  }, [sessionUserId, fetchProperty, fetchResidents]);

  if (isVerificationLoading || isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-gray-placeholder">Memuat Detail Properti...</span>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="mx-auto max-w-md my-12 text-center p-6 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm">
        <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-amber-950">Akses Menu Terkunci</h3>
        <p className="text-xs text-amber-800 mt-2 leading-relaxed">
          Unggah berkas KK Anda terlebih dahulu dan tunggu hingga diverifikasi Ketua RT untuk mengakses menu ini.
        </p>
      </div>
    );
  }

  if (!property) return null;

  // My-properties page is strictly for Property Owner Monitoring (Read-Only)
  const isCoordinator = false;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/my-properties"
            className="p-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text cursor-pointer transition-colors"
            title="Kembali ke Daftar Aset"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-heading-main">
              {property.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-secondary-text mt-0.5">
              Blok {property.dwelling.blockNumber} No. {property.dwelling.houseNumber} &bull; Tipe: <span className="capitalize">{property.dwelling.type}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-border gap-6">
        {property.dwelling.type !== "homestay" && (
          <button
            onClick={() => setActiveTab("residents")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "residents"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Kamar & Penghuni ({activeResidents.length})</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab("business")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "business"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Pengaturan Bisnis</span>
        </button>
        {property.dwelling.type !== "homestay" && (
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Sewa ({inactiveResidents.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: PENGHUNI AKTIF */}
      {activeTab === "residents" && (
        <ResidentsTab
          property={property}
          activeResidents={activeResidents}
          isCoordinator={isCoordinator}
          onCheckOut={(res) => {
            setSelectedResidentForCheckOut(res);
            setIsCheckOutOpen(true);
          }}
          onEdit={(res) => {
            setSelectedResidentForEdit(res);
            setIsEditOpen(true);
          }}
          onResubmit={(id) => {
            setResidentIdToSend(id);
            setIsSendConfirmOpen(true);
          }}
          onDelete={(id) => {
            setResidentIdToDelete(id);
            setIsDeleteConfirmOpen(true);
          }}
          onViewDetail={(res) => {
            setSelectedResidentForDetail(res);
            setIsDetailOpen(true);
          }}
        />
      )}

      {/* TAB 2: PENGATURAN BISNIS */}
      {activeTab === "business" && (
        <BusinessTab
          property={property}
          sessionUserId={sessionUserId}
          onRefreshProperty={fetchProperty}
        />
      )}

      {/* TAB 3: RIWAYAT SEWA */}
      {activeTab === "history" && (
        <HistoryTab
          inactiveResidents={inactiveResidents}
          onViewDetail={(res) => {
            setSelectedResidentForDetail(res);
            setIsDetailOpen(true);
          }}
        />
      )}

      {/* Modal Actions */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={fetchResidents}
        propertyId={Number(propertyId)}
      />

      <CheckOutModal
        isOpen={isCheckOutOpen}
        onClose={() => {
          setIsCheckOutOpen(false);
          setSelectedResidentForCheckOut(null);
        }}
        onSuccess={fetchResidents}
        resident={selectedResidentForCheckOut}
      />

      {isEditOpen && (
        <EditResidentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedResidentForEdit(null);
          }}
          onSuccess={fetchResidents}
          resident={selectedResidentForEdit}
        />
      )}

      <DetailResidentModal
        key={selectedResidentForDetail?.id}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedResidentForDetail(null);
        }}
        resident={selectedResidentForDetail}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-heading-main mb-2">Hapus Pendaftaran Penyewa</h3>
            <p className="text-xs text-gray-secondary-text mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus pendaftaran penyewa ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteResident}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to RT Confirmation Modal */}
      {isSendConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSendConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-heading-main mb-2">Kirim Ulang ke RT</h3>
            <p className="text-xs text-gray-secondary-text mb-6 leading-relaxed">
              Apakah Anda yakin data penyewa ini sudah diperbaiki dan siap dikirim ulang ke pengurus RT untuk proses verifikasi dokumen?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsSendConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
                disabled={isSendingToRT}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResubmitToRT}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer transition-colors flex items-center gap-1.5"
                disabled={isSendingToRT}
              >
                {isSendingToRT && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
