import { FileValidationOptions } from "./types";

export const FILE_PRESETS: Record<string, FileValidationOptions & { folder: string }> = {
  /** Preset untuk Foto Profil Avatar */
  AVATAR: {
    folder: "avatars",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSizeMB: 2,
    targetFormat: "image/webp",
    quality: 0.8,
    maxWidthOrHeight: 800,
  },

  /** Preset untuk Logo Kop Surat RT */
  LOGO: {
    folder: "logos",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSizeMB: 2,
    targetFormat: "image/png", // PNG menjaga transparansi logo
    quality: 0.9,
    maxWidthOrHeight: 1000,
  },

  /** Preset untuk Dokumen Scan KTP (Otomatis dikonversi ke PDF jika berupa gambar) */
  KTP: {
    folder: "ktp",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxSizeMB: 5,
    quality: 0.85,
    maxWidthOrHeight: 1920,
    convertToPdf: true,
  },

  /** Preset untuk Dokumen Scan KK (Otomatis dikonversi ke PDF jika berupa gambar) */
  KK: {
    folder: "kk",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxSizeMB: 5,
    quality: 0.85,
    maxWidthOrHeight: 1920,
    convertToPdf: true,
  },

  /** Preset untuk Lampiran Laporan / Pengaduan Warga */
  COMPLAINT: {
    folder: "complaints",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSizeMB: 5,
    targetFormat: "image/webp",
    quality: 0.8,
    maxWidthOrHeight: 1920,
  },

  /** Preset Dokumen Umum */
  DOCUMENT: {
    folder: "documents",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxSizeMB: 5,
    targetFormat: "image/webp",
    quality: 0.8,
    maxWidthOrHeight: 1920,
  },

  /** Preset Lampiran Kegiatan & Jadwal RT */
  ACTIVITY: {
    folder: "activities",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxSizeMB: 5,
    quality: 0.8,
    maxWidthOrHeight: 1920,
  },

  /** Preset Lampiran Pengumuman Resmi RT */
  ANNOUNCEMENT: {
    folder: "announcements",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
    maxSizeMB: 5,
    quality: 0.8,
    maxWidthOrHeight: 1920,
  },
};
