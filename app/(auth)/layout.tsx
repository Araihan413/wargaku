import React from "react";
import Image from "next/image";
import backgroundAuth from "@/public/background/BackgroundAuth.webp";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundAuth}
          alt="Latar Belakang Autentikasi"
          fill
          priority
          placeholder="blur"
          className="object-cover select-none pointer-events-none"
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-20 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
