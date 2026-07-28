"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, UserCog, CheckCircle, Copy, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const coordinatorSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(100),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit").max(15).optional().nullable().or(z.literal("")),
});

interface AddCoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserOption {
  id: string;
  name: string;
  nik?: string | null;
  email?: string | null;
  phone?: string | null;
}

export const AddCoordinatorModal: React.FC<AddCoordinatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Success view states after successful creation
  const [createdData, setCreatedData] = useState<{
    name: string;
    email: string;
    generatedPassword?: string | null;
    emailSent: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: {
      name: "",
      email: "",
      nik: "",
      phone: "",
    },
  });

  // Fetch registered users (excluding current coordinators) to promote
  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await fetch("/api/users?status=active");
        if (res.ok) {
          const data = await res.json();
          // Filter to only include warga biasa (roleId !== 5 && roleId !== 1)
          const wargaOnly = (data.users || []).filter((u: any) => u.roleId !== 5 && u.roleId !== 1);
          setUsers(wargaOnly);
        }
      } catch (err) {
        console.error("Gagal memuat warga:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  // Click outside listener for the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users.slice(0, 10); // Show first 10 by default
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        (u.nik && u.nik.includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    setValue("name", user.name);
    setValue("email", user.email || "");
    setValue("nik", user.nik || "");
    setValue("phone", user.phone || "");
    setSearchQuery(user.name);
    setIsDropdownOpen(false);
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
    reset({
      name: "",
      email: "",
      nik: "",
      phone: "",
    });
  };

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/coordinators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          existingUserId: selectedUser?.id || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal membuat akun koordinator");
      }

      toast.success(result.message || "Koordinator berhasil didaftarkan");
      
      // If a new user account was created, show credentials in the success screen
      if (result.data.isNewUserCreated) {
        setCreatedData({
          name: data.name,
          email: data.email,
          generatedPassword: result.data.generatedPassword,
          emailSent: result.data.emailSent,
        });
      } else {
        // Just directly close and success
        onSuccess();
        onClose();
        handleClearSelectedUser();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin ke papan klip!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-card border border-gray-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-gray-heading-main">
              {createdData ? "Kredensial Koordinator Baru" : "Buat Akun Koordinator Baru"}
            </h2>
          </div>
          {!isSubmitting && !createdData && (
            <button
              onClick={() => {
                onClose();
                handleClearSelectedUser();
              }}
              className="text-gray-placeholder hover:text-gray-heading-main p-1.5 rounded-lg hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {createdData ? (
          /* SUCCESS VIEW (SHOW PASSWORD) */
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="flex flex-col items-center text-center space-y-2">
              <CheckCircle className="h-14 w-14 text-emerald-500 animate-bounce" />
              <h3 className="text-lg font-bold text-gray-heading-main">Akun Berhasil Dibuat!</h3>
              <p className="text-xs text-gray-secondary-text max-w-sm">
                Kredensial login berikut telah dibuat untuk koordinator **{createdData.name}**.
              </p>
            </div>

            <div className="border border-gray-border rounded-2xl bg-gray-sidebar-hover/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-border/60 pb-3">
                <div>
                  <span className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider block">Email Login</span>
                  <span className="text-sm font-semibold text-gray-heading-main font-mono">{createdData.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(createdData.email)}
                  className="p-2 text-gray-secondary-text hover:text-primary hover:bg-white rounded-lg border border-gray-border/60 bg-gray-card shadow-sm transition-all cursor-pointer"
                  title="Salin Email"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-placeholder font-bold uppercase tracking-wider block">Password Default</span>
                  <span className="text-sm font-bold text-gray-heading-main font-mono tracking-wider">{createdData.generatedPassword}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(createdData.generatedPassword || "")}
                  className="p-2 text-gray-secondary-text hover:text-primary hover:bg-white rounded-lg border border-gray-border/60 bg-gray-card shadow-sm transition-all cursor-pointer"
                  title="Salin Password"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {createdData.emailSent ? (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs leading-relaxed">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <span className="font-bold block">Terkirim ke Email</span>
                  Kredensial login di atas juga telah otomatis dikirimkan ke email koordinator (**{createdData.email}**).
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs leading-relaxed">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold block">Gagal Mengirim Email</span>
                  Kredensial gagal dikirim ke email secara otomatis karena kendala SMTP/Brevo. **Harap salin password di atas secara manual** dan berikan kepada koordinator baru.
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                  handleClearSelectedUser();
                  setCreatedData(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
            <div className="p-6 space-y-5 overflow-y-auto">
              
              {/* Cari Warga Dropdown (Autocomplete) */}
              <div ref={containerRef} className="space-y-2 relative">
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Cari Warga Terdaftar (Promosikan)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isLoadingUsers}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      if (!e.target.value.trim() && selectedUser) {
                        handleClearSelectedUser();
                      }
                    }}
                    onFocus={() => {
                      setIsDropdownOpen(true);
                    }}
                    placeholder={isLoadingUsers ? "Memuat warga..." : "-- Pilih Warga Setempat untuk Dipromosikan (Ketik Nama) --"}
                    className="w-full bg-gray-card border border-gray-border rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isLoadingUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-placeholder" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-placeholder" />
                    )}
                  </div>
                </div>

                {isDropdownOpen && !isLoadingUsers && (
                  <div className="absolute left-0 z-50 w-full rounded-xl border border-gray-border bg-gray-card p-1.5 shadow-xl max-h-48 overflow-y-auto mt-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {selectedUser && (
                      <div
                        onClick={handleClearSelectedUser}
                        className="flex items-center rounded-lg py-2 px-2.5 cursor-pointer text-xs text-red-600 hover:bg-gray-sidebar-hover font-bold border-b border-gray-border/40 mb-1"
                      >
                        -- Batalkan Promosi Warga / Input Baru --
                      </div>
                    )}
                    {filteredUsers.length === 0 ? (
                      <div className="py-3 px-2.5 text-xs text-gray-placeholder text-center">
                        Tidak ada warga terdaftar yang cocok
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={`flex flex-col gap-0.5 rounded-lg py-2 px-2.5 cursor-pointer transition-colors text-xs ${
                            selectedUser?.id === u.id
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover"
                          }`}
                        >
                          <span className="font-semibold text-gray-heading-main">{u.name}</span>
                          <span className="text-[10px] text-gray-placeholder">
                            NIK: {u.nik || "Tidak ada"} • Email: {u.email || "-"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedUser && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs">
                    <span className="font-medium">
                      ✓ Mempromosikan warga: <strong>{selectedUser.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelectedUser}
                      className="text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              <hr className="border-gray-border" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nama Lengkap <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!selectedUser || isSubmitting}
                    {...register("name")}
                    placeholder="Nama sesuai KTP"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-sidebar-hover/30 disabled:text-gray-secondary-text"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>}
                </div>

                {/* NIK */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    NIK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    disabled={!!selectedUser || isSubmitting}
                    {...register("nik")}
                    placeholder="Masukkan NIK"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-sidebar-hover/30 disabled:text-gray-secondary-text"
                  />
                  {errors.nik && <p className="text-[10px] text-red-500 font-semibold">{errors.nik.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Email <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="email"
                    disabled={!!selectedUser || isSubmitting}
                    {...register("email")}
                    placeholder="contoh@wargaku.com"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-sidebar-hover/30 disabled:text-gray-secondary-text"
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    {...register("phone")}
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-gray-border px-6 py-4 shrink-0 gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  onClose();
                  handleClearSelectedUser();
                }}
                className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-xs font-semibold text-gray-heading-main cursor-pointer transition-all disabled:opacity-50"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Buat Akun Koordinator"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
