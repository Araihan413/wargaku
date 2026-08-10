"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import wargakuText from '@/public/logo/wargakuTeks.webp';
import Image from "next/image";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import {
  Lock,
  Mail,
  Loader2,
  User,
  Phone,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  UserCircle,
  Building2,
} from "lucide-react";

import { FormField } from "@/components/FormField"; 
import { DwellingDropdown } from "@/components/register/DwellingDropdown";
interface DwellingOption {
  id: number;
  label: string;
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Step State
  const [step, setStep] = useState(1);

  // UI States
  const [dwellingsList, setDwellingsList] = useState<DwellingOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "warga",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      name: "",
      nik: "",
      familyNumber: "",
      dwellingId: "",
    },
    mode: "onTouched",
  });

  const accountType = useWatch({
    control,
    name: "accountType",
  }) || "warga";

  const dwellingId = useWatch({
    control,
    name: "dwellingId",
  });

  // Field configurations for looping
  const step1Fields = [
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "contoh@email.com",
      icon: Mail,
      registerProps: register("email"),
      error: errors.email?.message,
    },
    {
      id: "phone",
      label: "Nomor WhatsApp / HP",
      type: "text",
      required: true,
      placeholder: "081234567890",
      icon: Phone,
      note: "Digunakan untuk dihubungi oleh RT/RW.",
      registerProps: register("phone", {
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue("phone", e.target.value.replace(/\D/g, ""));
        },
      }),
      error: errors.phone?.message,
    },
    {
      id: "password",
      label: "Password",
      type: showPassword ? "text" : "password",
      required: true,
      placeholder: "••••••••",
      icon: Lock,
      isPassword: true,
      registerProps: register("password"),
      error: errors.password?.message,
    },
    {
      id: "confirmPassword",
      label: "Konfirmasi Password",
      type: "password",
      required: true,
      placeholder: "••••••••",
      icon: Lock,
      registerProps: register("confirmPassword"),
      error: errors.confirmPassword?.message,
    },
  ];

  const step2Fields = [
    {
      id: "name",
      label: accountType === "coordinator" ? "Nama Lengkap Koordinator / Pengelola" : "Nama Lengkap Kepala Keluarga",
      type: "text",
      required: true,
      placeholder: "Nama lengkap sesuai KTP",
      icon: User,
      registerProps: register("name"),
      error: errors.name?.message,
    },
    ...(accountType === "warga"
      ? [
          {
            id: "nik",
            label: "NIK Kepala Keluarga",
            type: "text",
            required: true,
            placeholder: "16 digit NIK",
            icon: FileText,
            maxLength: 16,
            registerProps: register("nik", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setValue("nik", e.target.value.replace(/\D/g, ""));
              },
            }),
            error: errors.nik?.message,
          },
          {
            id: "familyNumber",
            label: "Nomor Kartu Keluarga (KK)",
            type: "text",
            required: true,
            placeholder: "16 digit Nomor KK",
            icon: FileText,
            maxLength: 16,
            registerProps: register("familyNumber", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setValue("familyNumber", e.target.value.replace(/\D/g, ""));
              },
            }),
            error: errors.familyNumber?.message,
          },
        ]
      : []),
  ];

  // Fetch Dwellings List for Dropdown
  useEffect(() => {
    async function fetchDwellings() {
      try {
        const res = await fetch("/api/dwellings");
        if (res.ok) {
          const data = await res.json();
          const validDwellings = Array.isArray(data) ? data.filter((d: any) => d.type !== 'homestay') : [];
          setDwellingsList(validDwellings);
        }
      } catch (err) {
        console.error("Gagal memuat daftar hunian:", err);
      }
    }
    fetchDwellings();
  }, []);

  const handleNextStep = async () => {
    const isStep1Valid = await trigger(["email", "phone", "password", "confirmPassword"]);
    if (isStep1Valid) {
      setStep(2);
    } else {
      toast.error("Silakan periksa kembali input Langkah 1 Anda");
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);

    try {
      const roleId = data.accountType === "coordinator" ? 5 : 6;
      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          nik: data.nik,
          roleId: roleId, // 5 = Koordinator Kost, 6 = Warga
          status: "pending", // Status default pending menunggu persetujuan RT
          familyNumber: data.accountType === "warga" ? data.familyNumber : undefined,
          dwellingId: data.accountType === "warga" && data.dwellingId ? Number(data.dwellingId) : undefined,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: async () => {
            if (data.accountType === "warga") {
              try {
                const res = await fetch("/api/auth/complete-registration", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    nik: data.nik,
                    familyNumber: data.familyNumber,
                    dwellingId: data.dwellingId ? Number(data.dwellingId) : null,
                  }),
                });
                
                if (!res.ok) {
                  const errData = await res.json();
                  toast.error(errData.error || "Gagal menyimpan data kependudukan.");
                  // Akan tetap lanjut signout karena user account sudah terbuat
                }
              } catch (err) {
                console.error("Error completing registration", err);
                toast.error("Gagal menyimpan data kependudukan.");
              }
            }

            await authClient.signOut();
            setIsLoading(false);
            toast.success(
              data.accountType === "coordinator"
                ? "Registrasi Koordinator Kos berhasil! Akun Anda berstatus PENDING menunggu verifikasi Ketua RT."
                : "Registrasi mandiri Kepala Keluarga berhasil! Akun Anda berstatus PENDING menunggu verifikasi Ketua RT."
            );
            router.push("/login");
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Pendaftaran gagal. Email atau NIK mungkin sudah terdaftar.");
          },
        }
      );
    } catch {
      setIsLoading(false);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex justify-center items-center gap-8 md:gap-16 w-full max-w-4xl">

      {/* Right Column: Multi-step Register Card */}
      <div className="w-full max-w-md bg-gray-card/70 backdrop-blur-xl border border-gray-border/50 p-8 rounded-3xl shadow-xl self-center">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-heading-main text-center">
            Daftar Akun
          </h2>
          <div className="mt-2">
            <Image 
              src={wargakuText}
              alt="Text Wargaku"
              priority
              className="w-40"
            />
          </div>
          
          <p className="text-xs text-gray-secondary-text mt-1">
            {accountType === "coordinator" ? "Pendaftaran Mandiri Koordinator Kos" : "Registrasi Mandiri Kepala Keluarga Baru"}
          </p>

          {/* Step Indicator Badge */}
          <div className="flex items-center gap-2 mt-4 w-full justify-center">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                step === 1
                  ? "bg-primary text-white"
                  : "bg-secondary-100 text-secondary-900"
              }`}
            >
              1. Akun & Kontak
            </span>
            <span className="text-gray-divider">/</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                step === 2
                  ? "bg-primary text-white"
                  : "bg-gray-sidebar-hover text-gray-placeholder"
              }`}
            >
              2. Kependudukan
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-sidebar-hover h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>

        {/* STEP 1 FORM */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Account Type Selector (Warga vs Koordinator Kos) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Pilih Jenis Akun <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-sidebar-hover/30 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setValue("accountType", "warga")}
                  className={`flex items-center gap-2 justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    accountType === "warga"
                      ? "bg-primary text-white shadow-xs"
                      : "text-gray-secondary-text hover:text-gray-heading-main"
                  }`}
                >
                  <UserCircle className="h-5 w-5" />
                  Warga (KK)
                </button>
                <button
                  type="button"
                  onClick={() => setValue("accountType", "coordinator")}
                  className={`flex items-center gap-2 justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    accountType === "coordinator"
                      ? "bg-primary text-white shadow-xs"
                      : "text-gray-secondary-text hover:text-gray-heading-main"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  Koordinator Kos
                </button>
              </div>
            </div>

            {step1Fields.map((field) => (
              <FormField
                key={field.id}
                {...field}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            ))}

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="group flex w-full justify-center items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 shadow-lg shadow-primary/25 transition-all duration-200"
              >
                Lanjut
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 FORM */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {step2Fields.map((field) => (
              <FormField key={field.id} {...field} />
            ))}

            {accountType === "warga" && (
              <>
                <DwellingDropdown
                  dwellingsList={dwellingsList}
                  dwellingId={dwellingId!}
                  onSelect={(id) => {
                    setValue("dwellingId", id);
                  }}
                  error={errors.dwellingId?.message}
                />
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center justify-center gap-1.5 w-1/3 rounded-2xl border border-gray-border px-4 py-3 text-sm font-semibold text-gray-body-text-btn hover:bg-gray-sidebar-hover transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 justify-center items-center gap-1.5 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-900 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Daftar Akun
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-4 mt-6 border-t border-gray-divider space-y-3">
          <p className="text-sm text-gray-secondary-text">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-900"
            >
              Masuk Sekarang
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
    </div>
  );
}
