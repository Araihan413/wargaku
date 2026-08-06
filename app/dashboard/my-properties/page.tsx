"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Home, Users, ShieldAlert, Loader2, ArrowRight, X, Building2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFamilyVerification } from "@/lib/hooks/use-family-verification";
import { DwellingSearchSelect } from "./_components/DwellingSearchSelect";
import { CoordinatorSearchSelect } from "./_components/CoordinatorSearchSelect";
import { validateAndParseRoomPattern } from "@/lib/room-helper";
import { PermissionGuard } from "@/components/PermissionGuard";

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
  coordinatorName?: string | null;
  coordinatorPhone?: string | null;
  coordinatorStatus?: "pending" | "active" | "suspended" | null;
  coordinatorHasPassword?: boolean | null;
}

interface DwellingOption {
  id: number;
  label: string;
  blockNumber: string;
  houseNumber: string;
  type: string;
  ownerUserId: string | null;
  hasActiveRental?: boolean;
}

function formatWhatsAppLink(phone: string, text: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("0")
    ? "62" + cleanPhone.slice(1)
    : cleanPhone;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export default function MyPropertiesPage() {
  return (
    <PermissionGuard requiredPermission="manage-my-properties">
      <MyPropertiesContent />
    </PermissionGuard>
  );
}

function MyPropertiesContent() {
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
  const [notes, setNotes] = useState("");
  const [roomPattern, setRoomPattern] = useState("");

  // Auto-validate and parse pattern
  const patternResult = useMemo(() => {
    if (!roomPattern.trim()) {
      return { isValid: true, rooms: [], error: "" };
    }
    return validateAndParseRoomPattern(roomPattern);
  }, [roomPattern]);

  const patternError = patternResult.isValid ? "" : patternResult.error || "Pola penomoran tidak valid";
  const generatedPreview = patternResult.rooms;

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedCoordUserId, setSelectedCoordUserId] = useState<string | null>(null);
  const [selectedCoordUserName, setSelectedCoordUserName] = useState<string>("");

  // Invitation link popup details
  const [inviteModalData, setInviteModalData] = useState<{
    propertyName: string;
    coordinatorName: string;
    inviteLink: string;
    phone: string;
  } | null>(null);

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
        // Filter: dwellings owned by user or unclaimed (null), not registered, of type kos or homestay
        const filtered = json.filter(
          (d: DwellingOption) =>
            (d.ownerUserId === sessionUserId || !d.ownerUserId) &&
            !d.hasActiveRental &&
            (d.type === "kos" || d.type === "homestay")
        );
        setDwellings(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  }, [sessionUserId]);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users?limit=100&status=active");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

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
    const activeTotalRooms = roomPattern.trim() && patternResult.isValid ? patternResult.rooms.length : Number(totalRooms);
    if (activeTotalRooms <= 0) {
      toast.error("Jumlah kamar harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      dwellingId: Number(selectedDwellingId),
      name: propertyName,
      totalRooms: activeTotalRooms,
      contactPerson: contactPerson || null,
      phone: businessPhone || null,
      notes: notes || null,
      roomPattern: roomPattern || null,
    };

    if (coordinatorOption === "self") {
      payload.coordinatorUserId = sessionUserId;
    } else {
      if (!selectedCoordUserId) {
        toast.error("Pilih koordinator terdaftar dari daftar pengguna");
        setIsSubmitting(false);
        return;
      }
      payload.coordinatorUserId = selectedCoordUserId;
    }

    try {
      const res = await fetch("/api/my-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Properti pribadi berhasil didaftarkan");
        setIsModalOpen(false);

        // Reset Form
        setSelectedDwellingId("");
        setPropertyName("");
        setTotalRooms(0);
        setContactPerson("");
        setBusinessPhone("");
        setNotes("");
        setRoomPattern("");
        setCoordinatorOption("self");
        setSelectedCoordUserId(null);
        setSelectedCoordUserName("");
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
    setSelectedDwellingId("");
    setPropertyName("");
    setTotalRooms(0);
    setContactPerson("");
    setBusinessPhone("");
    setNotes("");
    setRoomPattern("");
    setCoordinatorOption("self");
    setSelectedCoordUserId(null);
    setSelectedCoordUserName("");
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
            Aset Properti Sewa
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
            if (users.length === 0) {
              fetchUsers();
            }
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
            const isPendingRegister = p.coordinatorUserId !== null && !isSelfManaged && p.coordinatorHasPassword === false;
            const isPendingApproval = p.coordinatorUserId !== null && !isSelfManaged && p.coordinatorHasPassword === true && p.coordinatorStatus === "pending";

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
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        p.type === "kos"
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {p.type}
                      </span>
                      {isPendingRegister && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                          Pending Registrasi
                        </span>
                      )}
                      {isPendingApproval && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                          Pending RT
                        </span>
                      )}
                    </div>
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
                          {isSelfManaged ? "Kelola Sendiri" : p.coordinatorName || p.contactPerson || "Ditunjuk"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-border/50 flex justify-between items-center">
                  <div>
                    {isPendingRegister && (
                      <button
                        onClick={() => {
                          const inviteUrl = `${window.location.origin}/register/coordinator?id=${p.coordinatorUserId}`;
                          setInviteModalData({
                            propertyName: p.name,
                            coordinatorName: p.coordinatorName || "Penjaga Kos",
                            inviteLink: inviteUrl,
                            phone: p.coordinatorPhone || "",
                          });
                        }}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-200/60 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Kirim Link WA</span>
                      </button>
                    )}
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity" onClick={handleModalClose} />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden z-10 mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-heading-main">Daftarkan Properti Sewa Baru</h2>
                <p className="text-[10px] text-gray-secondary-text mt-0.5">
                  Lengkapi berkas pendaftaran berikut untuk mendaftarkan aset sewaan Anda.
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Form Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Dwelling Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Pilih Alamat Fisik Properti <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <DwellingSearchSelect
                    dwellings={dwellings}
                    selectedDwellingId={selectedDwellingId}
                    onSelect={setSelectedDwellingId}
                    placeholder="-- Pilih Tempat Tinggal Anda (Ketik untuk mencari) --"
                  />
                </div>

                {/* Property Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nama Properti <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Kos Melati, Villa Sentosa"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>

                {/* Shorthand Room Pattern */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Pola Penomoran Kamar (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: a1-a6, b1-b8, c1"
                    value={roomPattern}
                    onChange={(e) => setRoomPattern(e.target.value)}
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-[10px] text-gray-secondary-text leading-relaxed">
                    Mendukung penomoran otomatis. Kosongkan jika ingin nomor urut default (01, 02, dst.).
                  </p>
                  {patternError && (
                    <p className="text-[10px] font-semibold text-rose-600 animate-in fade-in duration-200">
                      {patternError}
                    </p>
                  )}
                  {generatedPreview.length > 0 && (
                    <div className="p-3 bg-gray-sidebar-hover/10 border border-gray-border/60 rounded-xl space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <span className="text-[10px] font-bold text-gray-heading-main block">
                        Pratinjau Hasil ({generatedPreview.length} Kamar):
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {generatedPreview.map((rm) => (
                          <span
                            key={rm}
                            className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold font-mono"
                          >
                            {rm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Capacity Rooms & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Jumlah Kamar/Pintu <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={roomPattern.trim() && patternResult.isValid ? patternResult.rooms.length : (totalRooms || "")}
                      onChange={(e) => setTotalRooms(Number(e.target.value))}
                      disabled={!!roomPattern.trim() && patternResult.isValid}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-70 disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Nomor HP/WA Bisnis
                    </label>
                    <input
                      type="text"
                      placeholder="Format: 081234567890"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Manager/Contact Person */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nama Kontak Pengelola
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Bu Budi (Kos Melati)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Description/Notes */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Keterangan
                  </label>
                  <textarea
                    placeholder="Catatan tambahan mengenai kos/kontrakan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-20 resize-none"
                  />
                </div>

                {/* Coordinator Assignment Option (Hidden for Homestay) */}
                {!isHomestaySelected && (
                  <div className="space-y-1.5 border-t border-gray-border/50 pt-4">
                    <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                      Penunjukan Koordinator (Penjaga)
                    </label>
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

                {/* Sub-options for Coordinator (Search vs. Invite) */}
                {!isHomestaySelected && coordinatorOption === "other" && (
                    <div className="space-y-1.5 bg-gray-sidebar-hover/20 p-4 rounded-2xl border border-gray-border/60 animate-in slide-in-from-top-2 duration-200">
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
                          } else {
                            setContactPerson("");
                            setBusinessPhone("");
                          }
                        }}
                        placeholder="-- Cari nama warga/koordinator terdaftar --"
                      />
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0 bg-gray-card">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Simpan Properti</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal Pop-up */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs" onClick={() => setInviteModalData(null)} />
          <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col p-6 z-10 mx-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setInviteModalData(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-heading-main">Kirim Tautan Undangan Penjaga</h3>
              <p className="text-xs text-gray-secondary-text leading-relaxed">
                Tautan pendaftaran pengelola untuk <strong>{inviteModalData.propertyName}</strong> telah berhasil dibuat. Silakan kirim tautan di bawah ini ke WhatsApp <strong>{inviteModalData.coordinatorName}</strong> agar mereka dapat melengkapi akunnya.
              </p>

              {/* Readonly Link Box */}
              <div className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl p-3 text-left">
                <p className="text-[10px] font-bold text-gray-placeholder uppercase mb-1">Tautan Registrasi</p>
                <p className="text-xs text-gray-heading-main font-mono truncate select-all">{inviteModalData.inviteLink}</p>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-3 mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteModalData.inviteLink);
                    toast.success("Tautan pendaftaran berhasil disalin!");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-border hover:bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text cursor-pointer transition-colors"
                >
                  Salin Tautan
                </button>
                <a
                  href={formatWhatsAppLink(
                    inviteModalData.phone,
                    `Halo ${inviteModalData.coordinatorName}, saya telah mendaftarkan Anda sebagai koordinator properti sewa ${inviteModalData.propertyName} di aplikasi Wargaku. Silakan lengkapi data diri dan kata sandi akun Anda melalui tautan pendaftaran berikut:\n\n${inviteModalData.inviteLink}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
