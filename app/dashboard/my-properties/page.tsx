"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Home,  Users, ShieldAlert, Loader2, ArrowRight, X, Building2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";

interface PropertyItem {
  id: number;
  dwellingId: number;
  name: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms: number;
  isActive: boolean;
  blockNumber: string;
  houseNumber: string;
  type: string;
}

interface DwellingOption {
  id: number;
  label: string;
  blockNumber: string;
  houseNumber: string;
  type: string;
  ownerUserId: string | null;
}

export default function MyPropertiesPage() {
  const { data: session } = authClient.useSession();
  const sessionUserId = session?.user?.id;
  const { isVerified, isLoading: isVerificationLoading } = useFamilyVerification(session?.user?.roleId);

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [dwellings, setDwellings] = useState<DwellingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [selectedDwellingId, setSelectedDwellingId] = useState<string>("");
  const [propertyName, setPropertyName] = useState("");
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [contactPerson, setContactPerson] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [coordinatorOption, setCoordinatorOption] = useState<"self" | "other">("self");

  // Coordinator Account States (Case B)
  const [coordEmail, setCoordEmail] = useState("");
  const [coordNik, setCoordNik] = useState("");
  const [coordName, setCoordName] = useState("");
  const [coordPhone, setCoordPhone] = useState("");

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/my-properties?isActive=true");
      if (res.ok) {
        const json = await res.json();
        setProperties(json.data || []);
      } else {
        toast.error("Gagal mengambil daftar properti pribadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDwellings = useCallback(async () => {
    if (!sessionUserId) return;
    try {
      const res = await fetch("/api/dwellings");
      if (res.ok) {
        const json = await res.json();
        // Filter: dwellings owned by user or unclaimed (null), of type kos or homestay
        const filtered = json.filter(
          (d: DwellingOption) =>
            (d.ownerUserId === sessionUserId || !d.ownerUserId) &&
            (d.type === "kos" || d.type === "homestay")
        );
        setDwellings(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  }, [sessionUserId]);

  useEffect(() => {
    if (sessionUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProperties();
      fetchDwellings();
    }
  }, [sessionUserId, fetchProperties, fetchDwellings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDwellingId) {
      toast.error("Pilih alamat tempat tinggal terlebih dahulu");
      return;
    }
    if (!propertyName.trim()) {
      toast.error("Nama properti wajib diisi");
      return;
    }
    if (totalRooms <= 0) {
      toast.error("Jumlah kamar harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      dwellingId: Number(selectedDwellingId),
      name: propertyName,
      totalRooms: Number(totalRooms),
      contactPerson: contactPerson || null,
      phone: businessPhone || null,
    };

    if (coordinatorOption === "self") {
      payload.coordinatorUserId = sessionUserId;
    } else {
      // Coordinator is another person
      if (!coordEmail.trim() || !coordNik.trim() || !coordName.trim()) {
        toast.error("Data Koordinator Baru wajib diisi lengkap");
        setIsSubmitting(false);
        return;
      }
      payload.coordinatorEmail = coordEmail;
      payload.coordinatorNik = coordNik;
      payload.coordinatorName = coordName;
      payload.coordinatorPhone = coordPhone || null;
    }

    try {
      const res = await fetch("/api/my-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          coordinatorOption === "other"
            ? "Properti berhasil didaftarkan! Akun koordinator baru sedang menunggu persetujuan RT."
            : "Properti pribadi berhasil didaftarkan"
        );
        setIsModalOpen(false);
        // Reset Form
        setSelectedDwellingId("");
        setPropertyName("");
        setTotalRooms(0);
        setContactPerson("");
        setBusinessPhone("");
        setCoordEmail("");
        setCoordNik("");
        setCoordName("");
        setCoordPhone("");
        setCoordinatorOption("self");
        fetchProperties();
      } else {
        toast.error(data.error || "Gagal mendaftarkan properti");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (isVerificationLoading || isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-gray-placeholder">Memuat Properti Anda...</span>
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

  // Selected dwelling type helper
  const selectedDwelling = dwellings.find(d => String(d.id) === selectedDwellingId);
  const isHomestaySelected = selectedDwelling?.type === "homestay";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Kelola Properti Pribadi
          </h1>
          <p className="text-xs sm:text-sm text-gray-secondary-text mt-0.5">
            Daftarkan kos, kontrakan, atau homestay milik Anda dan kelola pengelolaannya.
          </p>
        </div>
        <button
          onClick={() => {
            if (dwellings.length === 0) {
              toast.error("Tidak ada hunian berjenis Kos/Homestay yang terdaftar atas nama Anda atau yang belum memiliki pemilik di sistem RT ini. Silakan hubungi RT.");
              return;
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Daftarkan Properti Baru</span>
        </button>
      </div>

      {/* Properties List */}
      {properties.length === 0 ? (
        <div className="rounded-3xl border border-gray-border bg-gray-card p-12 text-center shadow-sm">
          <Building2 className="h-16 w-16 text-gray-placeholder mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-heading-main mb-1">Belum Ada Properti Terdaftar</h3>
          <p className="text-xs text-gray-secondary-text max-w-sm mx-auto leading-relaxed">
            Anda belum mendaftarkan kos atau kontrakan sewaan Anda di sistem RT ini. Klik tombol di kanan atas untuk mendaftarkannya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const isSelfManaged = p.coordinatorUserId === sessionUserId;
            return (
              <div
                key={p.id}
                className="group relative rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-gray-heading-main group-hover:text-primary transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <span className="text-[9px] font-bold text-gray-secondary-text uppercase tracking-wider">
                        Blok {p.blockNumber} No. {p.houseNumber}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                      p.type === "kos"
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {p.type}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-sidebar-hover/30 p-3.5 rounded-2xl border border-gray-border/40 text-xs">
                    <div className="flex items-center gap-2 text-gray-secondary-text">
                      <Home className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-placeholder leading-none">Kapasitas</p>
                        <p className="font-bold text-gray-heading-main mt-0.5">{p.totalRooms} Kamar</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-secondary-text">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-placeholder leading-none">Pengelola</p>
                        <p className="font-bold text-gray-heading-main mt-0.5 truncate max-w-22.5">
                          {isSelfManaged ? "Kelola Sendiri" : p.contactPerson || "Ditunjuk"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-border/50 flex justify-end">
                  <Link
                    href={`/dashboard/my-properties/${p.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2.5 transition-all"
                  >
                    <span>Kelola Properti</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleModalClose} />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-3xl border border-gray-border bg-gray-card p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-border animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={handleModalClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-secondary-text hover:bg-gray-sidebar-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-heading-main mb-1">Daftarkan Properti Sewa Baru</h2>
            <p className="text-xs text-gray-secondary-text mb-6">
              Lengkapi berkas pendaftaran berikut untuk mendaftarkan aset sewaan Anda.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dwelling Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-heading-main block">Pilih Alamat Fisik Properti</label>
                <select
                  value={selectedDwellingId}
                  onChange={(e) => setSelectedDwellingId(e.target.value)}
                  className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                  required
                >
                  <option value="" disabled className="bg-gray-card">-- Pilih Tempat Tinggal Anda --</option>
                  {dwellings.map((d) => (
                    <option key={d.id} value={d.id} className="bg-gray-card">
                      {d.label} ({d.type === "kos" ? "Kos" : "Homestay"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-heading-main block">Nama Properti</label>
                <input
                  type="text"
                  placeholder="Misal: Kos Melati, Villa Sentosa"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Capacity Rooms & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-heading-main block">Jumlah Kamar/Pintu</label>
                  <input
                    type="number"
                    min={1}
                    value={totalRooms || ""}
                    onChange={(e) => setTotalRooms(Number(e.target.value))}
                    className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-heading-main block">Nomor HP/WA Bisnis</label>
                  <input
                    type="text"
                    placeholder="Format: 081234567890"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Manager/Contact Person */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-heading-main block">Nama Kontak Pengelola</label>
                <input
                  type="text"
                  placeholder="Misal: Bu Budi (Kos Melati)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3.5 py-2.5 text-xs placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Coordinator Assignment Option (Hidden for Homestay) */}
              {!isHomestaySelected && (
                <div className="space-y-1.5 border-t border-gray-border/50 pt-4">
                  <label className="text-xs font-bold text-gray-heading-main block">Penunjukan Koordinator (Penjaga)</label>
                  <div className="grid grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Case B: Coordinator Account Form */}
              {!isHomestaySelected && coordinatorOption === "other" && (
                <div className="space-y-3 bg-gray-sidebar-hover/20 p-4 rounded-2xl border border-gray-border/60 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                    Calon Koordinator yang ditunjuk wajib melengkapi email aktif untuk pembuatan akun login (status pending persetujuan RT).
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-heading-main uppercase tracking-wider block">Email Calon Koordinator</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={coordEmail}
                      onChange={(e) => setCoordEmail(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-heading-main uppercase tracking-wider block">NIK Calon Koordinator</label>
                    <input
                      type="text"
                      placeholder="16 digit NIK"
                      value={coordNik}
                      onChange={(e) => setCoordNik(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-heading-main uppercase tracking-wider block">Nama Calon Koordinator</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={coordName}
                      onChange={(e) => setCoordName(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-heading-main uppercase tracking-wider block">Nomor HP/WA</label>
                    <input
                      type="text"
                      placeholder="081..."
                      value={coordPhone}
                      onChange={(e) => setCoordPhone(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-border/50">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-700 disabled:bg-primary/50 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Properti</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
