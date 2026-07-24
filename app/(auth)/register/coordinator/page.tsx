"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, Loader2, User, Phone, ShieldCheck, Eye, EyeOff, XCircle } from "lucide-react";
import bigLogo from "@/public/logo/bigLogo.webp";
import Image from "next/image";

function CoordinatorRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coordinator pre-filled details
  const [coordInfo, setCoordInfo] = useState<{ name: string; phone: string } | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchInfo() {
      try {
        const res = await fetch(`/api/users/coord-info?id=${id}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Tautan undangan tidak valid atau sudah kedaluwarsa.");
        } else {
          setCoordInfo(data);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Gagal memuat informasi pendaftaran. Silakan periksa koneksi internet Anda.");
      } finally {
        setIsLoadingInfo(false);
      }
    }

    fetchInfo();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!email.trim() || !nik.trim() || !password.trim()) {
      toast.error("Semua kolom input wajib diisi!");
      return;
    }

    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      toast.error("NIK harus terdiri dari 16 digit angka.");
      return;
    }

    if (password.length < 6) {
      toast.error("Kata sandi minimal harus terdiri dari 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users/coord-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, nik, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Pendaftaran gagal.");
      } else {
        toast.success("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Ketua RT.");
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="w-full max-w-md bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4">
        <XCircle className="h-12 w-12 text-error" />
        <h3 className="text-lg font-bold text-gray-heading-main">Undangan Tidak Valid</h3>
        <p className="text-xs text-gray-secondary-text leading-relaxed">
          Tautan pendaftaran tidak valid atau tidak memiliki token ID.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-2 w-full py-2.5 bg-gray-sidebar-hover hover:bg-gray-sidebar-hover/80 rounded-xl text-xs font-bold text-gray-heading-main transition-colors cursor-pointer"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    );
  }

  if (isLoadingInfo) {
    return (
      <div className="w-full max-w-md space-y-4 bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-gray-secondary-text">Memvalidasi token undangan...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="w-full max-w-md bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4">
        <XCircle className="h-12 w-12 text-error" />
        <h3 className="text-lg font-bold text-gray-heading-main">Undangan Tidak Valid</h3>
        <p className="text-xs text-gray-secondary-text leading-relaxed">
          {errorMsg}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-2 w-full py-2.5 bg-gray-sidebar-hover hover:bg-gray-sidebar-hover/80 rounded-xl text-xs font-bold text-gray-heading-main transition-colors cursor-pointer"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-heading-main">
          Aktivasi Koordinator
        </h2>
        <p className="mt-1 text-center text-xs text-gray-secondary-text">
          Lengkapi data diri Anda untuk mengaktifkan akun pengelola kos di{" "}
          <span className="text-primary font-semibold">Wargaku</span>.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name (Read-Only) */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Nama Lengkap (Ditunjuk Pemilik)
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4.5 w-4.5 text-gray-secondary-text/60" />
            </div>
            <input
              type="text"
              value={coordInfo?.name || ""}
              readOnly
              className="block w-full rounded-xl border border-gray-border bg-gray-sidebar-hover/20 py-2.5 pl-10 pr-3 text-sm text-gray-secondary-text cursor-not-allowed outline-none"
            />
          </div>
        </div>

        {/* Phone (Read-Only) */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Nomor HP/WhatsApp
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="h-4.5 w-4.5 text-gray-secondary-text/60" />
            </div>
            <input
              type="text"
              value={coordInfo?.phone || ""}
              readOnly
              className="block w-full rounded-xl border border-gray-border bg-gray-sidebar-hover/20 py-2.5 pl-10 pr-3 text-sm text-gray-secondary-text cursor-not-allowed outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Email Baru <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4.5 w-4.5 text-gray-placeholder" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-card py-2.5 pl-10 pr-3 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none"
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* NIK */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            NIK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <ShieldCheck className="h-4.5 w-4.5 text-gray-placeholder" />
            </div>
            <input
              type="text"
              maxLength={16}
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              required
              className="block w-full rounded-xl border border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-card py-2.5 pl-10 pr-3 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none"
              placeholder="Masukkan 16 digit NIK Anda"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kata Sandi <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4.5 w-4.5 text-gray-placeholder" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-card py-2.5 pl-10 pr-10 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none"
              placeholder="Minimal 6 karakter"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-secondary-text cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Konfirmasi Kata Sandi <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4.5 w-4.5 text-gray-placeholder" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-card py-2.5 pl-10 pr-10 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none"
              placeholder="Ulangi kata sandi"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-secondary-text cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full py-2.5 bg-primary hover:bg-primary-900 disabled:bg-primary/50 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Aktifkan Akun Pengelola</span>
        </button>
      </form>
    </div>
  );
}

export default function CoordinatorRegisterPage() {
  return (
    <div className="grid md:grid-cols-2 items-center gap-8 md:gap-16 w-full max-w-375">
      {/* Left Column: Logo */}
      <div className="col-span-1 w-full">
        <div className="flex justify-center items-center shrink-0">
          <Image
            src={bigLogo}
            alt="Logo Wargaku"
            width={200}
            height={200}
            priority
            className="rounded-lg w-48 md:w-72 drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right Column: Register Card */}
      <div className="col-span-1 flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <CoordinatorRegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
