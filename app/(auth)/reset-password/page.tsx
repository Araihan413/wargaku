"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import bigLogo from "@/public/logo/bigLogo.webp";
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/lib/validations/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Token reset kata sandi tidak valid atau telah kadaluarsa.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      });

      if (res.error) {
        setIsLoading(false);
        toast.error(
          res.error.message || "Gagal memperbarui kata sandi. Token mungkin sudah tidak berlaku."
        );
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
      toast.success("Kata sandi berhasil diperbarui!");

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (error) {
      setIsLoading(false);
      console.error("Terjadi kesalahan:", error);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-heading-main">
            Tautan Tidak Valid
          </h2>
          <p className="text-sm text-gray-secondary-text leading-relaxed">
            Tautan pemulihan kata sandi tidak ditemukan atau sudah tidak berlaku.
            Silakan ajukan ulang permintaan reset kata sandi.
          </p>
        </div>

        <div className="pt-4 w-full space-y-3">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-2xl bg-primary text-sm font-semibold text-white hover:bg-primary-900 shadow-lg shadow-primary/25 transition-all"
          >
            Minta Tautan Baru
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-gray-body-text-btn bg-gray-card border border-gray-border hover:bg-gray-border/30 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-heading-main">
            Kata Sandi Diperbarui!
          </h2>
          <p className="text-sm text-gray-secondary-text leading-relaxed">
            Kata sandi akun Anda berhasil diubah. Mengalihkan ke halaman masuk...
          </p>
        </div>

        <div className="pt-4 w-full">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-2xl bg-primary text-sm font-semibold text-white hover:bg-primary-900 shadow-lg shadow-primary/25 transition-all"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-heading-main">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-gray-secondary-text leading-relaxed">
          Buat kata sandi baru untuk akun{" "}
          <span className="text-primary font-semibold">Wargaku</span> Anda.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5"
            >
              Password Baru <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-gray-placeholder" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password")}
                className={`w-full bg-gray-card border ${
                  errors.password
                    ? "border-error focus:ring-error/20 focus:border-error"
                    : "border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                } rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none`}
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-heading-small cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-error mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5"
            >
              Konfirmasi Password Baru <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-gray-placeholder" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={`w-full bg-gray-card border ${
                  errors.confirmPassword
                    ? "border-error focus:ring-error/20 focus:border-error"
                    : "border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                } rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none`}
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-heading-small cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-error mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all duration-200 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Simpan Kata Sandi Baru"
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-secondary-text hover:text-gray-heading-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Batal dan kembali ke login
          </Link>
        </div>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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

      {/* Right Column: Reset Password Card */}
      <div className="col-span-1 flex justify-center">
        <div className="w-full max-w-md space-y-8 bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl self-center">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
