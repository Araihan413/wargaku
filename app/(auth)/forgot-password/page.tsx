"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import bigLogo from "@/public/logo/bigLogo.webp";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      const res = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      });

      if (res.error) {
        setIsLoading(false);
        toast.error(res.error.message || "Gagal mengirim email reset password.");
        return;
      }

      setIsLoading(false);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Instruksi reset kata sandi telah dikirim ke email Anda.");
    } catch (error) {
      setIsLoading(false);
      console.error("Terjadi kesalahan:", error);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

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
            className="rounded-lg w-48 md:w-72 h-48 md:h-72 object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right Column: Form or Success Card */}
      <div className="col-span-1 flex justify-center">
        <div className="w-full max-w-md space-y-8 bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl self-center">
          {isSubmitted ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-heading-main">
                  Periksa Email Anda
                </h2>
                <p className="text-sm text-gray-secondary-text leading-relaxed">
                  Kami telah mengirimkan tautan pemulihan kata sandi ke:
                  <br />
                  <span className="font-semibold text-gray-heading-main">
                    {submittedEmail}
                  </span>
                </p>
              </div>

              <div className="bg-gray-card border border-gray-border p-4 rounded-xl text-left text-xs text-gray-secondary-text space-y-1 w-full">
                <p className="font-semibold text-gray-heading-main">
                  Catatan:
                </p>
                <p>• Tautan berlaku selama 1 jam.</p>
                <p>• Periksa juga folder Spam/Junk jika tidak menemukan di Inbox.</p>
              </div>

              <div className="pt-2 w-full space-y-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full py-2.5 text-sm font-semibold text-primary hover:text-primary-900 transition-colors cursor-pointer"
                >
                  Kirim Ulang Email
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-gray-body-text-btn bg-gray-card border border-gray-border hover:bg-gray-border/30 rounded-2xl transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-heading-main">
                  Lupa Password?
                </h2>
                <p className="mt-2 text-sm text-gray-secondary-text leading-relaxed">
                  Masukkan alamat email yang terdaftar pada akun{" "}
                  <span className="text-primary font-semibold">Wargaku</span> Anda.
                  Kami akan mengirimkan instruksi untuk me-reset password.
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5"
                  >
                    Email <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-5 w-5 text-gray-placeholder" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      className={`w-full bg-gray-card border ${
                        errors.email
                          ? "border-error focus:ring-error/20 focus:border-error"
                          : "border-gray-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      } rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-gray-heading-main placeholder-gray-placeholder transition-all outline-none`}
                      placeholder="nama@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-error mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all duration-200 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Kirim Instruksi Reset"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-secondary-text hover:text-gray-heading-main transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke halaman login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
