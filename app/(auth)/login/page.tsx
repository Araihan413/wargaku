"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import bigLogo from "@/public/logo/bigLogo.webp"
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    console.log(data)

    try {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: () => {
            setIsLoading(false);
            toast.success("Login berhasil! Mengalihkan...");
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Email atau password salah.");
          },
        }
      );
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
            className="rounded-lg w-48 md:w-72 drop-shadow-2xl"
          />
        </div>
      </div>
      
      {/* Right Column: Login Card */}
      <div className="col-span-1">
        <div className="w-full max-w-md space-y-8 bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-3xl shadow-xl self-center">
          <div className="flex flex-col items-center">
            {/* Logo / Icon */}
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
              Selamat Datang!
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Masuk untuk mengakses akun <span className="text-indigo-600 dark:text-indigo-400">Wargaku</span> anda.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 rounded-sm">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className={`block w-full rounded-xl border ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    } bg-white dark:bg-slate-900/50 py-3 pl-10 pr-3 text-slate-900 dark:text-white placeholder-slate-400 sm:text-sm transition-all outline-none`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className={`block w-full rounded-xl border ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    } bg-white dark:bg-slate-900/50 py-3 pl-10 pr-10 text-slate-900 dark:text-white placeholder-slate-400 sm:text-sm transition-all outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-2 justify-center items-center">
                <input type="checkbox" className="w-4 h-4 cursor-pointer"/>
                <p className="text-sm">Ingat Saya</p>
              </div>
              <div>
                <button className="cursor-pointer">
                  <p className="text-sm text-indigo-400 hover:text-indigo-500">Lupa Password?</p>
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          </form>

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Belum punya akun warga?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Daftar Mandiri
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
