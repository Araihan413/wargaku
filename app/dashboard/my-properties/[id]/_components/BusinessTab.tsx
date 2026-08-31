"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

import { CoordinatorSearchSelect, UserOption } from "../../_components/CoordinatorSearchSelect";
import { PropertyDetails } from "../types";
import { getAppBaseUrl } from "@/lib/config";


interface BusinessTabProps {
  property: PropertyDetails;
  sessionUserId: string | undefined;
  onRefreshProperty: () => Promise<void>;
}

export function BusinessTab({
  property,
  sessionUserId,
  onRefreshProperty,
}: BusinessTabProps) {
  const router = useRouter();

  // Form States
  const [name, setName] = useState(property?.name || "");
  const [totalRooms, setTotalRooms] = useState<number>(property?.totalRooms || 0);
  const [occupiedRooms, setOccupiedRooms] = useState<number>(property?.occupiedRooms || 0);
  const [contactPerson, setContactPerson] = useState(property?.contactPerson || "");
  const [businessPhone, setBusinessPhone] = useState(property?.phone || "");
  const [notes, setNotes] = useState(property?.notes || "");

  const [coordinatorOption, setCoordinatorOption] = useState<"self" | "other">(
    property?.coordinatorUserId === sessionUserId || !property?.coordinatorUserId ? "self" : "other"
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedCoordUserId, setSelectedCoordUserId] = useState<string | null>(
    property?.coordinatorUserId && property?.coordinatorUserId !== sessionUserId ? property.coordinatorUserId : null
  );
  const [selectedCoordUserName, setSelectedCoordUserName] = useState<string>(
    property?.coordinator?.name || ""
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // QR Code Image State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Track the previous props to adjust state during render when props change
  const [prevProperty, setPrevProperty] = useState<PropertyDetails | null>(property);
  const [prevSessionUserId, setPrevSessionUserId] = useState<string | undefined>(sessionUserId);

  if (property && (property !== prevProperty || sessionUserId !== prevSessionUserId)) {
    setPrevProperty(property);
    setPrevSessionUserId(sessionUserId);
    setName(property.name);
    setTotalRooms(property.totalRooms);
    setOccupiedRooms(property.occupiedRooms || 0);
    setContactPerson(property.contactPerson || "");
    setBusinessPhone(property.phone || "");
    setNotes(property.notes || "");

    const isSelf = property.coordinatorUserId === sessionUserId || !property.coordinatorUserId;
    setCoordinatorOption(isSelf ? "self" : "other");

    if (property.coordinatorUserId && property.coordinatorUserId !== sessionUserId) {
      setSelectedCoordUserId(property.coordinatorUserId);
      setSelectedCoordUserName(property.coordinator?.name || "");
    }
  }

  useEffect(() => {
    let isCancelled = false;
    if (coordinatorOption === "other") {
      fetch("/api/users?limit=100&status=active&excludeRoleIds=1&publicSearch=true")
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled) {
            setUsers(data.users || []);
            setIsLoadingUsers(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (!isCancelled) setIsLoadingUsers(false);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [coordinatorOption]);

  useEffect(() => {
    if (property?.dwelling?.qrToken) {
      const origin = getAppBaseUrl();
      const qrUrl = `${origin}/scan-qr?token=${encodeURIComponent(property.dwelling.qrToken)}`;

      
      QRCode.toDataURL(qrUrl, { width: 300, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [property?.dwelling?.qrToken]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama properti wajib diisi");
      return;
    }
    const activeTotalRooms = Number(totalRooms);
    const activeOccupiedRooms = Number(occupiedRooms);
    if (activeTotalRooms < 0 || activeOccupiedRooms < 0) {
      toast.error("Jumlah kamar tidak boleh negatif");
      return;
    }
    if (activeOccupiedRooms > activeTotalRooms) {
      toast.error("Jumlah kamar terisi tidak boleh melebihi total kapasitas kamar");
      return;
    }

    setIsUpdating(true);

    const payload: any = {
      name,
      totalRooms: activeTotalRooms,
      occupiedRooms: activeOccupiedRooms,
      contactPerson: contactPerson || null,
      phone: businessPhone || null,
      notes: notes || null,
    };

    if (property.dwelling.type === "homestay") {
      payload.coordinatorUserId = null;
    } else {
      if (coordinatorOption === "self") {
        payload.coordinatorUserId = sessionUserId;
      } else {
        if (!selectedCoordUserId) {
          toast.error("Pilih koordinator terdaftar dari daftar pengguna");
          setIsUpdating(false);
          return;
        }
        payload.coordinatorUserId = selectedCoordUserId;
      }
    }

    try {
      const res = await fetch(`/api/my-properties/${property.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Pengaturan properti sewa berhasil disimpan");
        await onRefreshProperty();
      } else {
        toast.error(data.error || "Gagal memperbarui properti");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/my-properties/${property.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Properti berhasil dinonaktifkan");
        router.push("/dashboard/my-properties");
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus properti");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `QR_Properti_${name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code properti berhasil diunduh");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Form Pengaturan (2 Kolom) */}
      <div className="lg:col-span-2 rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-heading-main mb-6 border-b border-gray-border pb-3">
          Informasi Operasional Aset
        </h3>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nama Properti <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Total Kapasitas Kamar <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={totalRooms || ""}
                onChange={(e) => setTotalRooms(Number(e.target.value))}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Jumlah Kamar Terisi <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={totalRooms}
                value={occupiedRooms}
                onChange={(e) => setOccupiedRooms(Number(e.target.value))}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
              <p className="text-[10px] text-gray-secondary-text font-medium mt-1">
                Kamar Kosong: <strong className="text-amber-600">{Math.max(0, totalRooms - occupiedRooms)} Kamar</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                WhatsApp Bisnis
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nama Kontak
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Description/Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Keterangan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan mengenai kos/kontrakan (opsional)"
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-20 resize-none"
            />
          </div>

          {/* Coordinator Assignment Option (Hidden for Homestay) */}
          {property.dwelling.type !== "homestay" && (
            <div className="space-y-1.5 border-t border-gray-border/50 pt-4">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Penunjukan Koordinator (Penjaga)
              </label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setCoordinatorOption("self")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    coordinatorOption === "self"
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
                  }`}
                >
                  Kelola Sendiri
                </button>
                <button
                  type="button"
                  onClick={() => setCoordinatorOption("other")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    coordinatorOption === "other"
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-sidebar-hover/10 border-gray-border text-gray-secondary-text hover:bg-gray-sidebar-hover/30"
                  }`}
                >
                  Tunjuk Orang Lain
                </button>
              </div>

              {coordinatorOption === "other" && (
                <div className="space-y-3 bg-gray-sidebar-hover/20 p-4 rounded-2xl border border-gray-border/60 animate-in slide-in-from-top-2 duration-200">
                  {property.coordinator && property.coordinator.status === "pending" && (
                    <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                      Status pengelola: Menunggu persetujuan RT untuk aktivasi akun.
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Cari Koordinator Terdaftar <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <CoordinatorSearchSelect
                      users={users}
                      isLoading={isLoadingUsers}
                      selectedUserId={selectedCoordUserId}
                      selectedUserName={selectedCoordUserName}
                      onSelect={(u) => {
                        setSelectedCoordUserId(u?.id || null);
                        setSelectedCoordUserName(u?.name || "");
                        if (u) {
                          setContactPerson(u.name);
                          setBusinessPhone(u.phone || "");
                        }
                      }}
                      placeholder="-- Cari nama warga/koordinator terdaftar --"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-border/50 mt-8 gap-4">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 px-4 py-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span>Hapus/Nonaktifkan Properti</span>
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-700 text-xs font-bold text-white px-5 py-2.5 transition-all cursor-pointer disabled:bg-primary/50"
            >
              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* QR Code Card (1 Kolom) */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm text-center flex flex-col items-center">
        <h3 className="text-xs font-bold text-gray-heading-main uppercase tracking-wider mb-4">
          QR Code Aset Properti
        </h3>
        
        {qrCodeUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-border/50 inline-block shadow-sm">
              <Image
                src={qrCodeUrl}
                alt="QR Code Properti"
                width={192}
                height={192}
                className="mx-auto"
                unoptimized
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main py-2.5 cursor-pointer transition-all"
            >
              <QrCode className="h-4 w-4 text-primary" />
              <span>Unduh QR Code Properti</span>
              <Download className="h-3.5 w-3.5 text-gray-placeholder" />
            </button>
          </div>
        ) : (
          <div className="py-12 text-gray-placeholder">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <span className="text-xs">Menyiapkan QR Code...</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-gray-card border border-gray-border rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-heading-main mb-2">Hapus/Nonaktifkan Properti</h3>
            <p className="text-xs text-gray-secondary-text mb-6 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan properti ini? Semua data penyewa aktif akan tetap tersimpan di riwayat, tetapi properti ini tidak akan aktif lagi di sistem.
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
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  handleDelete();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
