"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2, KeyRound, Building2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { KtpUploadInput } from "@/components/KtpUploadInput";
import { uploadFileToCloudinary } from "@/lib/upload-helper";

function ActivateAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tokenData, setTokenData] = useState<{
    email: string;
    nik: string;
    userName: string;
    propertyName: string;
    roomNumber: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form Fields
  const [familyNumber, setFamilyNumber] = useState("");
  const [kkFile, setKkFile] = useState<File | string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);


  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError("Tautan aktivasi tidak valid atau tidak memiliki token.");
        setIsLoadingToken(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/activate-account?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setTokenData(data);
        } else {
          setTokenError(data.error || "Tautan aktivasi tidak valid atau telah kedaluwarsa.");
        }
      } catch (err) {
        console.error(err);
        setTokenError("Terjadi kesalahan jaringan saat memvalidasi tautan.");
      } finally {
        setIsLoadingToken(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (familyNumber.replace(/\D/g, "").length !== 16) {
      toast.error("Nomor KK harus terdiri dari 16 digit angka.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    setIsSubmitting(true);

    try {
      let kkUrl: string | null = null;
      if (kkFile instanceof File) {
        const uploadRes = await uploadFileToCloudinary(kkFile, "kk");
        kkUrl = uploadRes.url;
      } else if (typeof kkFile === "string") {
        kkUrl = kkFile;
      }

      const res = await fetch("/api/auth/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          familyNumber: familyNumber.replace(/\D/g, ""),
          kkFile: kkUrl,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Akun berhasil diaktifkan!");
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(data.error || "Gagal mengaktifkan akun.");
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("Gagal mengunggah berkas") && !err.message.includes("melebihi batas") && !err.message.includes("Format berkas")) {
        toast.error(err.message || "Terjadi kesalahan jaringan.");
      }
    } finally {
      setIsSubmitting(false);
    }


  };

  if (isLoadingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-gray-secondary-text font-medium">Memvalidasi tautan aktivasi...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xl text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Tautan Tidak Valid</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{tokenError}</p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-900 transition-all cursor-pointer"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-emerald-200 rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Aktivasi Berhasil!</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Akun WargaKu dan data keluarga Anda telah aktif. Anda akan dialihkan ke halaman login secara otomatis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Aktivasi Akun & Data Keluarga</h1>
          <p className="text-xs text-gray-500">
            Lengkapi Nomor KK dan password Anda untuk mengaktifkan akun WargaKu
          </p>
        </div>

        {/* Info Ringkasan Unit Kos (Read-only) */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Building2 className="h-4 w-4" />
            <span>{tokenData.propertyName} {tokenData.roomNumber ? `(Kamar ${tokenData.roomNumber})` : ""}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block">Kepala Keluarga:</span>
              <span className="font-semibold text-gray-800">{tokenData.userName}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">NIK:</span>
              <span className="font-mono font-semibold text-gray-800">{tokenData.nik}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Read-only */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Email Terdaftar
            </label>
            <input
              type="email"
              value={tokenData.email}
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed font-medium"
            />
          </div>

          {/* Nomor KK (16 Digit) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nomor KK (16 Digit) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan 16 digit Nomor KK"
              value={familyNumber}
              onChange={(e) => setFamilyNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              required
            />
          </div>

          {/* Scan KK (Opsional) */}
          <div className="space-y-1.5">
            <KtpUploadInput
              value={kkFile}
              onChange={setKkFile}
              label="Unggah Scan / Foto Kartu Keluarga (Opsional)"
            />
          </div>

          {/* Password & Konfirmasi Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Password Baru <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl pl-3.5 pr-10 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Konfirmasi Password <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-card border border-gray-border rounded-xl pl-3.5 pr-10 py-2.5 text-sm placeholder:text-gray-placeholder text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>


          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Aktivasi...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Aktifkan Akun & Lengkapi Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
