"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import bigLogo from "@/public/logo/bigLogo.webp";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { PendingVerificationCard } from "./_components/PendingVerificationCard";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<{
    name?: string;
    email?: string;
    nik?: string;
    phone?: string;
    familyNumber?: string;
    unitNumber?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (res.error) {
        setIsLoading(false);
        toast.error(res.error.message || "Email atau password salah.");
        // Record failed login audit log
        fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, reason: res.error.message || "Email atau Password Salah" }),
        }).catch(() => {});
        return;
      }

      const user = res.data?.user as any;

      if (user?.status === "pending") {
        await authClient.signOut();
        setIsLoading(false);
        setPendingUser({
          name: user.name,
          email: user.email,
          nik: user.nik,
          phone: user.phone,
          familyNumber: user.familyNumber,
          unitNumber: user.unitNumber,
        });
        toast.warning(
          "Akun Anda berstatus PENDING. Silakan tunggu verifikasi dari Ketua RT."
        );
        fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, reason: "Akun Berstatus Pending Approval" }),
        }).catch(() => {});
        return;
      }

      if (user?.status === "suspended") {
        await authClient.signOut();
        setIsLoading(false);
        toast.error("Akun Anda telah ditangguhkan. Silakan hubungi pengurus RT.");
        fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, reason: "Akun Dalam Status Ditangguhkan (Suspended)" }),
        }).catch(() => {});
        return;
      }


      setIsLoading(false);
      toast.success("Login berhasil! Mengalihkan...");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      console.log("Terjadi kesalahan:", error);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  return (
    <div className="grid md:grid-cols-2 items-center gap-8 md:gap-16 w-full max-w-375">
      {/* Left Column: Logo (Hidden/Stacked nicely on mobile) */}
      <div className="col-span-1 w-full">
        <div className="flex justify-center items-center shrink-0">
          <Image
            src={bigLogo}
            alt="Logo Wargaku"
            width={200}
            height={200}
            priority
            className="rounded-lg w-48 md:w-72 h-48 md:h-72 object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right Column: Login Card or Pending Verification Card */}
      <div className="col-span-1 flex justify-center">
        {pendingUser ? (
          <PendingVerificationCard
            user={pendingUser}
            onBackToLogin={() => setPendingUser(null)}
          />
        ) : (
          <div className="w-full max-w-md space-y-8 bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl self-center">
            <div className="flex flex-col items-center">
              {/* Logo / Icon */}
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-heading-main">
                Selamat Datang!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-secondary-text">
                Masuk untuk mengakses akun{" "}
                <span className="text-primary font-semibold">Wargaku</span> anda.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 rounded-sm">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5"
                  >
                    Email <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-placeholder" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      className={`block w-full rounded-xl border ${
                        errors.email
                          ? "border-error focus:ring-error/20 focus:border-error"
                          : "border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      } bg-gray-card py-2.5 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder text-sm transition-all outline-none`}
                      placeholder="name@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-error mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-black/80 tracking-wider"
                    >
                      Password <span className="text-red-500 ml-0.5">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-placeholder" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password")}
                      className={`block w-full rounded-xl border ${
                        errors.password
                          ? "border-error focus:ring-error/20 focus:border-error"
                          : "border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      } bg-gray-card py-2.5 pl-10 pr-10 text-gray-heading-main placeholder-gray-placeholder text-sm transition-all outline-none`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-heading-small"
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
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="rememberMe" className="flex gap-2 items-center cursor-pointer select-none">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register("rememberMe")}
                    className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span className="text-sm text-gray-body-text-btn font-medium">Ingat Saya</span>
                </label>
                <div>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary-400 hover:text-primary transition-colors"
                  >
                    Lupa Password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Masuk"
                  )}
                </button>
              </div>
            </form>

            <div className="text-center pt-4 border-t border-gray-divider space-y-3">
              <p className="text-sm text-gray-secondary-text">
                Belum punya akun warga?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:text-primary-900"
                >
                  Daftar Mandiri
                </Link>
              </p>
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-secondary-text hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

