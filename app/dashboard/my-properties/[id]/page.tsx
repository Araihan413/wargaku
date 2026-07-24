"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Users,
  Settings,
  History,
  QrCode,
  Download,
  Info,
  Calendar,
  Phone,
  Trash2,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import QRCode from "qrcode";
import { CheckInModal } from "./_components/CheckInModal";
import { CheckOutModal } from "./_components/CheckOutModal";

interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  roomNumber?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  isActive: boolean;
}

interface PropertyDetails {
  id: number;
  dwellingId: number;
  name: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms: number;
  isActive: boolean;
  activeResidentsCount: number;
  dwelling: {
    id: number;
    blockNumber: string;
    houseNumber: string;
    qrToken: string;
    type: string;
  };
  coordinator?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: string;
  } | null;
}

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

  // Form States (Tab Pengaturan Bisnis)
  const [name, setName] = useState("");
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [contactPerson, setContactPerson] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [coordinatorOption, setCoordinatorOption] = useState<"self" | "other">("self");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Coordinator Account States (Case B)
  const [coordEmail, setCoordEmail] = useState("");
  const [coordNik, setCoordNik] = useState("");
  const [coordName, setCoordName] = useState("");
  const [coordPhone, setCoordPhone] = useState("");

  // Modals States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedResidentForCheckOut, setSelectedResidentForCheckOut] = useState<RentalResidentItem | null>(null);
  
  // QR Code Image State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const fetchProperty = useCallback(async () => {
    try {
      const res = await fetch(`/api/my-properties/${propertyId}`);
      if (res.ok) {
        const json = await res.json();
        setProperty(json);
        
        // Fill form fields
        setName(json.name);
        setTotalRooms(json.totalRooms);
        setContactPerson(json.contactPerson || "");
        setBusinessPhone(json.phone || "");
        
        const isSelf = json.coordinatorUserId === sessionUserId || !json.coordinatorUserId;
        setCoordinatorOption(isSelf ? "self" : "other");
        if (json.coordinator) {
          setCoordEmail(json.coordinator.email || "");
          setCoordName(json.coordinator.name || "");
          setCoordPhone(json.coordinator.phone || "");
        }

        // Generate property QR code on demand
        if (json.dwelling?.qrToken) {
          const qrUrl = await QRCode.toDataURL(json.dwelling.qrToken, { width: 300, margin: 1 });
          setQrCodeUrl(qrUrl);
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
  }, [propertyId, sessionUserId, router]);

  const fetchResidents = useCallback(async () => {
    try {
      // Active residents
      const activeRes = await fetch(`/api/rentals/${propertyId}/residents?isActive=true`);
      if (activeRes.ok) {
        const json = await activeRes.json();
        setActiveResidents(json);
      }
      
      // Inactive residents history
      const inactiveRes = await fetch(`/api/rentals/${propertyId}/residents?isActive=false`);
      if (inactiveRes.ok) {
        const json = await inactiveRes.json();
        setInactiveResidents(json);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama properti wajib diisi");
      return;
    }
    if (totalRooms <= 0) {
      toast.error("Jumlah kamar harus lebih dari 0");
      return;
    }

    setIsUpdating(true);

    const payload: any = {
      name,
      totalRooms: Number(totalRooms),
      contactPerson: contactPerson || null,
      phone: businessPhone || null,
    };

    if (coordinatorOption === "self") {
      payload.coordinatorUserId = sessionUserId;
    } else {
      // Coordinator is another person
      if (!coordEmail.trim() || !coordNik.trim() || !coordName.trim()) {
        toast.error("Data Koordinator wajib diisi lengkap");
        setIsUpdating(false);
        return;
      }
      payload.coordinatorEmail = coordEmail;
      payload.coordinatorNik = coordNik;
      payload.coordinatorName = coordName;
      payload.coordinatorPhone = coordPhone || null;
      payload.coordinatorUserId = null; // Forces server to generate a new user or match NIK
    }

    try {
      const res = await fetch(`/api/my-properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Pengaturan properti sewa berhasil disimpan");
        fetchProperty();
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
    if (!confirm("Apakah Anda yakin ingin menonaktifkan properti ini? Semua data penyewa aktif akan tetap tersimpan di riwayat.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/my-properties/${propertyId}`, {
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

  // Case A check: Is the logged-in owner also the manager (coordinator)?
  const isCoordinator = property.coordinatorUserId === sessionUserId;

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

        {isCoordinator && (
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Check-In Warga Baru</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-border gap-6">
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
      </div>

      {/* TAB 1: KAMAR & PENGHUNI */}
      {activeTab === "residents" && (
        <div className="space-y-4">
          {!isCoordinator && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed shadow-sm">
              <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                <strong>Perhatian:</strong> Karena pengelolaan properti ini diserahkan kepada koordinator (<strong>{property.contactPerson || property.coordinator?.name}</strong>), Anda hanya memiliki akses memantau (<strong>Read-Only</strong>). Hak untuk mendaftarkan check-in/out dipegang oleh koordinator penanggung jawab.
              </p>
            </div>
          )}

          {activeResidents.length === 0 ? (
            <div className="rounded-3xl border border-gray-border bg-gray-card p-12 text-center shadow-sm">
              <Users className="h-16 w-16 text-gray-placeholder mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-heading-main mb-1">Kamar Masih Kosong</h3>
              <p className="text-xs text-gray-secondary-text max-w-sm mx-auto leading-relaxed">
                Belum ada penyewa yang terdaftar check-in di properti sewa ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeResidents.map((res) => (
                <div
                  key={res.id}
                  className="rounded-3xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-gray-heading-main line-clamp-1">{res.name}</h4>
                        <span className="text-[10px] text-gray-secondary-text font-mono uppercase">NIK: {res.nik}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold">
                        {res.roomNumber || "No Room"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-secondary-text">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-placeholder" />
                        <span>Check-In</span>
                      </div>
                      <div className="text-right font-semibold text-gray-heading-main">
                        {new Date(res.checkInDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-placeholder" />
                        <span>WhatsApp</span>
                      </div>
                      <div className="text-right font-mono text-gray-heading-main">{res.phone || "-"}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-border/50 flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      res.verificationStatus === "verified"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : res.verificationStatus === "rejected"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                    }`}>
                      {res.verificationStatus}
                    </span>

                    {isCoordinator && (
                      <button
                        onClick={() => {
                          setSelectedResidentForCheckOut(res);
                          setIsCheckOutOpen(true);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Check-Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENGATURAN BISNIS */}
      {activeTab === "business" && (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Jumlah Kamar/Pintu <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalRooms || ""}
                    onChange={(e) => setTotalRooms(Number(e.target.value))}
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nama Kontak Pengelola
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                          Email Koordinator <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={coordEmail}
                          onChange={(e) => setCoordEmail(e.target.value)}
                          className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                          NIK Koordinator <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="16 digit NIK"
                          value={coordNik}
                          onChange={(e) => setCoordNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                          className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                          Nama Koordinator <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={coordName}
                          onChange={(e) => setCoordName(e.target.value)}
                          className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                          Nomor HP/WA
                        </label>
                        <input
                          type="text"
                          placeholder="081..."
                          value={coordPhone}
                          onChange={(e) => setCoordPhone(e.target.value)}
                          className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  onClick={handleDelete}
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
                <p className="text-[10px] text-gray-secondary-text max-w-50 mx-auto leading-relaxed">
                  Pasang QR Code ini di luar pagar kos/kontrakan agar tamu/penyewa dapat men-scan untuk melapor atau sensitasi warga.
                </p>
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
        </div>
      )}

      {/* TAB 3: RIWAYAT SEWA */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {inactiveResidents.length === 0 ? (
            <div className="rounded-3xl border border-gray-border bg-gray-card p-12 text-center shadow-sm">
              <History className="h-16 w-16 text-gray-placeholder mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-heading-main mb-1">Riwayat Kosong</h3>
              <p className="text-xs text-gray-secondary-text max-w-sm mx-auto leading-relaxed">
                Belum ada riwayat penyewa lama yang pernah keluar/check-out dari properti ini.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-border bg-gray-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-border bg-gray-sidebar-hover/20 text-gray-heading-main font-bold">
                      <th className="py-4 px-5">Nama Penyewa</th>
                      <th className="py-4 px-5">Kamar</th>
                      <th className="py-4 px-5 font-mono">NIK</th>
                      <th className="py-4 px-5">Tanggal Masuk</th>
                      <th className="py-4 px-5">Tanggal Keluar</th>
                      <th className="py-4 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveResidents.map((res) => (
                      <tr key={res.id} className="border-b border-gray-border/60 hover:bg-gray-sidebar-hover/10 text-gray-secondary-text transition-colors">
                        <td className="py-4 px-5 font-bold text-gray-heading-main">{res.name}</td>
                        <td className="py-4 px-5">
                          <span className="px-2 py-0.5 rounded bg-gray-sidebar-hover text-[10px] font-semibold text-gray-secondary-text">
                            {res.roomNumber || "No Room"}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono">{res.nik}</td>
                        <td className="py-4 px-5">
                          {new Date(res.checkInDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-5">
                          {res.checkOutDate ? (
                            new Date(res.checkOutDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-1.5 py-0.5 rounded bg-gray-sidebar-hover text-[9px] font-bold uppercase tracking-wider text-gray-placeholder">
                            Inactive
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Actions */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={fetchResidents}
        propertyId={propertyId}
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
    </div>
  );
}
