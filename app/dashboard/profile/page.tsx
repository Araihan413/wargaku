"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, ShieldCheck, Home, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import { UserProfileData, ProfileTabType } from "./types";
import { ProfileHeader } from "./_components/ProfileHeader";
import { PersonalInfoTab } from "./_components/PersonalInfoTab";
import { SecurityTab } from "./_components/SecurityTab";
import { ResidencyInfoTab } from "./_components/ResidencyInfoTab";
import { ProfileSkeleton } from "./_components/ProfileSkeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTabType>("data-diri");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil data profil");
      }
      setProfile(data.profile);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          if (data.error) {
            setError(data.error);
          } else {
            setProfile(data.profile);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err?.message || "Terjadi kesalahan koneksi");
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleUpdateProfile = async (formDataPayload: {
    name: string;
    phone: string;
    imageFile?: File;
  }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", formDataPayload.name);
      formData.append("phone", formDataPayload.phone);
      if (formDataPayload.imageFile) {
        formData.append("image", formDataPayload.imageFile);
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil");
      }

      toast.success("Profil berhasil diperbarui!");
      setProfile(data.profile);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Gagal memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto profil maksimal 2 MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengunggah foto profil");
        return;
      }

      toast.success("Foto profil berhasil diperbarui!");
      setProfile(data.profile);
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah foto.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Gagal Memuat Profil</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data profil pengguna tidak dapat diakses."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={loadProfile} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Profil Ringkasan */}
      <ProfileHeader
        profile={profile}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarUpload={handleAvatarUpload}
      />

      {/* Standard Underline Tab Navigation */}
      <div className="flex border-b border-gray-border overflow-x-auto no-scrollbar mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("data-diri")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "data-diri"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <User className={`h-4.5 w-4.5 ${activeTab === "data-diri" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Data Diri & Kontak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keamanan")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "keamanan"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <ShieldCheck className={`h-4.5 w-4.5 ${activeTab === "keamanan" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Keamanan & Notifikasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kependudukan")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "kependudukan"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <Home className={`h-4.5 w-4.5 ${activeTab === "kependudukan" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Kependudukan & Hunian</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "data-diri" && (
        <PersonalInfoTab
          profile={profile}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdateProfile}
          onProfileUpdate={setProfile}
        />
      )}

      {activeTab === "keamanan" && <SecurityTab />}

      {activeTab === "kependudukan" && <ResidencyInfoTab profile={profile} />}
    </div>
  );
}
