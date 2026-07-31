"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, Shield, Calendar, Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserProfileData } from "../types";

interface ProfileHeaderProps {
  profile: UserProfileData;
  isUploadingAvatar: boolean;
  onAvatarUpload: (file: File) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isUploadingAvatar,
  onAvatarUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto profil maksimal 2 MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      onAvatarUpload(file);
    }
  };

  const getRoleBadgeColor = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 2:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 3:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 4:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 5:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formattedDate = new Date(profile.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-gray-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
      {/* Avatar Container with Upload Overlay */}
      <div className="relative group shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-gray-border flex items-center justify-center relative shadow-xs">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-3xl font-black text-primary uppercase">
              {profile.name.slice(0, 2)}
            </span>
          )}

          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>

        {/* Change Photo Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="absolute -bottom-2 -right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all cursor-pointer border-2 border-white"
          title="Ganti Foto Profil"
        >
          <Camera className="w-4 h-4" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
      </div>

      {/* Profile Details Header */}
      <div className="flex-1 text-center md:text-left space-y-2.5">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-heading-main tracking-tight">
            {profile.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
            {/* Role Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(
                profile.roleId
              )}`}
            >
              <Shield className="w-3 h-3" />
              <span>{profile.roleName || "Warga"}</span>
            </span>

            {/* Status Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Akun Aktif</span>
            </span>
          </div>
        </div>

        {/* Contact Info List */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-1.5 gap-x-4 text-xs text-gray-secondary-text font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>{profile.phone || "Belum Mengisi No. WA"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Bergabung {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
