"use client";

import React, { useState } from "react";
import { User, Phone, Mail, Save, Loader2 } from "lucide-react";
import { UserProfileData } from "../types";

interface PersonalInfoTabProps {
  profile: UserProfileData;
  isSubmitting: boolean;
  onSubmit: (data: { name: string; phone: string }) => void;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profile,
  isSubmitting,
  onSubmit,
}) => {
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      phone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight">
          Informasi Data Diri & Kontak
        </h2>
        <p className="text-xs text-gray-secondary-text mt-0.5">
          Perbarui username dan nomor telepon/WhatsApp Anda untuk keperluan informasi sistem RT.
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Username <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ketikkan nama lengkap sesuai KTP"
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Email Field (Readonly) */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-slate-100 border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-secondary-text cursor-not-allowed"
            />
          </div>
          <p className="text-[11px] text-gray-secondary-text mt-1">
            Email digunakan sebagai username login utama dan terikat dengan akun Anda.
          </p>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Nomor HP / WhatsApp <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
