"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function FamilyPageLoader() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getMyFamily() {
      try {
        const res = await fetch("/api/families/my");
        if (res.ok) {
          const data = await res.json();
          router.replace(`/dashboard/residents/keluarga/${data.id}`);
        } else {
          const data = await res.json();
          setError(data.error || "Gagal memuat data keluarga Anda.");
          setIsLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan koneksi sistem.");
        setIsLoading(false);
      }
    }

    getMyFamily();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-gray-secondary-text">Mengalihkan ke halaman keluarga Anda...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md my-12 rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-heading-main">Keluarga Belum Terdaftar</h3>
        <p className="mt-2 text-sm text-gray-secondary-text leading-relaxed">
          {error}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-900 text-white px-4 py-2.5 text-sm font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
