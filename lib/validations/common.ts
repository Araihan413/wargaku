import { z } from 'zod';

// Regex untuk validasi NIK (16 digit angka)
export const nikRegex = /^[0-9]{16}$/;

// Regex untuk validasi nomor KK (16 digit angka)
export const kkNumberRegex = /^[0-9]{16}$/;

// Regex untuk validasi nomor telepon Indonesia (misal: 081234567890 atau +6281234567890)
export const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

// Helper konversi teks ke Title Case
export const toTitleCase = (val: string): string => {
  return val
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Preprocessor untuk membersihkan format nomor telepon
export const phonePreprocessor = (val: unknown): string | null => {
  if (typeof val !== 'string') return null;
  const cleaned = val.trim().replace(/[-\s]/g, '');
  return cleaned === '' ? null : cleaned;
};

// Preprocessor tanggal wajib
export const datePreprocessor = (arg: unknown): unknown => {
  if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  return arg;
};

// Preprocessor tanggal opsional/nullable
export const optionalDatePreprocessor = (arg: unknown): Date | null | undefined => {
  if (arg === '' || arg === null || arg === undefined) return null;
  if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  return undefined;
};

// Skema telepon Indonesia yang dapat digunakan ulang
export const indonesianPhoneSchema = z.preprocess(
  phonePreprocessor,
  z
    .string()
    .refine((val) => !val || indonesianPhoneRegex.test(val), {
      message: 'Nomor telepon tidak valid. Gunakan format Indonesia (misal: 081234567890)',
    })
    .optional()
    .nullable()
);
