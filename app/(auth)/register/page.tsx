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
  Eye,
  EyeOff,
  Home,
  User,
  Phone,
  FileText,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface DwellingOption {
  id: number;
  label: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  maxLength?: number;
  note?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
  registerProps?: any;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  required = false,
  placeholder,
  icon: Icon,
  maxLength,
  note,
  isPassword = false,
  showPassword,
  setShowPassword,
  registerProps,
  error,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <input
          id={id}
          type={type}
          required={required}
          maxLength={maxLength}
          {...registerProps}
          className={`block w-full rounded-xl border ${
            error
              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
              : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          } py-3 pl-10 ${
            isPassword ? "pr-10" : "pr-3"
          } text-slate-900 placeholder-slate-400 sm:text-sm outline-none transition-all`}
          placeholder={placeholder}
        />
        {isPassword && setShowPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : note ? (
        <p className="text-[10px] text-slate-400 mt-1">{note}</p>
      ) : null}
    </div>
  );
};

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
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      name: "",
      nik: "",
      familyNumber: "",
      isManualDwelling: false,
      dwellingId: "",
      streetName: "",
      blockNumber: "",
      houseNumber: "",
      unitNumber: "",
    },
    mode: "onTouched",
  });

  const isManualDwelling = useWatch({
    control,
    name: "isManualDwelling",
  });
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
      placeholder: "nama@email.com",
      icon: Mail,
      registerProps: register("email"),
      error: errors.email?.message,
    },
    {
      id: "phone",
      label: "Nomor WhatsApp / HP",
      type: "tel",
      placeholder: "081234567890",
      icon: Phone,
      note: "Digunakan untuk notifikasi pengaduan & surat.",
      registerProps: register("phone", {
        onChange: (e) => {
          setValue("phone", e.target.value.replace(/\D/g, ""));
        },
      }),
      error: errors.phone?.message,
    },
    {
      id: "password",
      label: "Password",
      type: showPassword ? "text" : "password",
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
      placeholder: "••••••••",
      icon: Lock,
      registerProps: register("confirmPassword"),
      error: errors.confirmPassword?.message,
    },
  ];

  const step2Fields = [
    {
      id: "name",
      label: "Nama Lengkap Kepala Keluarga",
      type: "text",
      placeholder: "Nama lengkap sesuai KTP",
      icon: User,
      registerProps: register("name"),
      error: errors.name?.message,
    },
    {
      id: "nik",
      label: "NIK Kepala Keluarga",
      type: "text",
      placeholder: "16 digit NIK",
      icon: FileText,
      maxLength: 16,
      registerProps: register("nik", {
        onChange: (e) => {
          setValue("nik", e.target.value.replace(/\D/g, ""));
        },
      }),
      error: errors.nik?.message,
    },
    {
      id: "familyNumber",
      label: "Nomor Kartu Keluarga (KK)",
      type: "text",
      placeholder: "16 digit Nomor KK",
      icon: FileText,
      maxLength: 16,
      registerProps: register("familyNumber", {
        onChange: (e) => {
          setValue("familyNumber", e.target.value.replace(/\D/g, ""));
        },
      }),
      error: errors.familyNumber?.message,
    },
  ];

  // Fetch Dwellings List for Dropdown
  useEffect(() => {
    async function fetchDwellings() {
      try {
        const res = await fetch("/api/dwellings");
        if (res.ok) {
          const data = await res.json();
          setDwellingsList(data);
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

    // Format alamat manual jika dipilih
    let formattedManualAddress = "";
    if (data.isManualDwelling) {
      const parts = [
        data.streetName,
        data.blockNumber ? `Blok ${data.blockNumber}` : "",
        data.houseNumber ? `No. ${data.houseNumber}` : "",
      ].filter(Boolean);
      formattedManualAddress = parts.join(" ");
    }

    try {
      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          nik: data.nik,
          roleId: 6, // Role 'Warga'
          status: "pending", // Status default pending menunggu persetujuan RT
          familyNumber: data.familyNumber,
          dwellingId: data.isManualDwelling ? undefined : Number(data.dwellingId),
          unitNumber: data.unitNumber || undefined,
          manualAddress: data.isManualDwelling ? formattedManualAddress : undefined,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: () => {
            setIsLoading(false);
            toast.success(
              "Registrasi berhasil! Akun Anda berstatus PENDING menunggu verifikasi RT."
            );
            router.push("/login");
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Pendaftaran gagal. Email atau NIK mungkin sudah terdaftar.");
          },
        }
      );
    } catch (error) {
      setIsLoading(false);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex justify-center items-center gap-8 md:gap-16 w-full max-w-4xl">

      {/* Right Column: Multi-step Register Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-3xl shadow-xl self-center">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Daftar Akun
          </h2>
          <div className="">
            <Image 
              src={wargakuText}
              alt="Text Wargaku"
              priority
              className="w-40"
            />
          </div>
          
          <p className="text-xs text-slate-500 mt-1">
            Registrasi Mandiri Kepala Keluarga Baru
          </p>

          {/* Step Indicator Badge */}
          <div className="flex items-center gap-2 mt-4 w-full justify-center">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                step === 1
                  ? "bg-indigo-600 text-white"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
              }`}
            >
              1. Akun & Kontak
            </span>
            <span className="text-slate-300">/</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                step === 2
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              2. Kependudukan
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>

        {/* STEP 1 FORM */}
        {step === 1 && (
          <div className="space-y-4">
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
                className="group flex w-full justify-center items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all duration-200"
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

            {/* Dropdown Alamat Rumah */}
            <div>
              <label
                htmlFor="dwellingSelect"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Alamat Rumah tinggal
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="dwellingSelect"
                  value={isManualDwelling ? "manual" : (dwellingId || "")}
                  onChange={(e) => {
                    if (e.target.value === "manual") {
                      setValue("isManualDwelling", true);
                      setValue("dwellingId", "");
                    } else {
                      setValue("isManualDwelling", false);
                      setValue("dwellingId", e.target.value);
                    }
                  }}
                  className={`block w-full rounded-xl border ${
                    errors.dwellingId ? "border-red-500" : "border-slate-200"
                  } bg-white py-3 pl-10 pr-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm outline-none transition-all appearance-none`}
                >
                  <option value="" disabled>
                    Pilih alamat rumah terdaftar...
                  </option>
                  {dwellingsList.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                  <option value="manual">➕ Input Alamat Manual / Rumah Baru</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.dwellingId && (
                <p className="text-xs text-red-500 mt-1">{errors.dwellingId.message}</p>
              )}
            </div>

            {/* Input Alamat Manual (Kondisional) */}
            {isManualDwelling && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animation-all duration-300">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Detail Alamat Baru
                </p>

                {/* Nama Jalan/Gang */}
                <div>
                  <input
                    type="text"
                    {...register("streetName")}
                    className={`block w-full rounded-lg border ${
                      errors.streetName ? "border-red-500" : "border-slate-200"
                    } bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none`}
                    placeholder="Nama Jalan / Gang (Contoh: Jl. Mawar)"
                  />
                  {errors.streetName && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.streetName.message}</p>
                  )}
                </div>

                {/* Blok & Nomor Rumah */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    {...register("blockNumber")}
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none"
                    placeholder="Blok (Contoh: A4)"
                  />
                  <input
                    type="text"
                    {...register("houseNumber")}
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none"
                    placeholder="No. Rumah (Contoh: 12)"
                  />
                </div>
              </div>
            )}

            {/* Nomor Pintu/Unit (Kontrakan - Opsional) */}
            <FormField
              id="unitNumber"
              label="Nomor Pintu / Unit (Opsional)"
              type="text"
              placeholder="Contoh: Kamar 03 (Diisi jika menyewa/sekat)"
              icon={Home}
              registerProps={register("unitNumber")}
              error={errors.unitNumber?.message}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center justify-center gap-1.5 w-1/3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 justify-center items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

        <div className="text-center pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-sm text-slate-600">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
