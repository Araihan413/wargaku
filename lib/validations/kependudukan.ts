import { z } from 'zod';

// Regex untuk validasi nomor KK (16 digit angka)
const kkNumberRegex = /^[0-9]{16}$/;

// Regex untuk validasi NIK (16 digit angka)
const nikRegex = /^[0-9]{16}$/;

// Regex untuk validasi nomor telepon Indonesia (misal: 081234567890 atau +6281234567890)
const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

export const createFamilySchema = z.object({
  dwellingId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID tempat tinggal wajib diisi'
        : 'ID tempat tinggal harus berupa angka',
  }).int().positive('ID tempat tinggal tidak valid'),
  
  familyNumber: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nomor Kartu Keluarga wajib diisi'
        : 'Nomor Kartu Keluarga harus berupa teks',
  }).regex(kkNumberRegex, 'Nomor Kartu Keluarga harus terdiri dari 16 digit angka'),
  
  headUserId: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'ID User Kepala Keluarga wajib diisi'
        : 'ID User Kepala Keluarga harus berupa teks',
  }),
  
  headName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kepala Keluarga wajib diisi'
        : 'Nama Kepala Keluarga harus berupa teks',
  }).min(2, 'Nama Kepala Keluarga minimal 2 karakter')
    .max(100, 'Nama Kepala Keluarga maksimal 100 karakter'),
    
  unitNumber: z.string().max(10, 'Nomor unit maksimal 10 karakter').optional().nullable(),
  kkFile: z.string().max(255).optional().nullable(),
  
  checkInDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal masuk hunian wajib diisi'
        : 'Format tanggal masuk tidak valid',
  })),
  
  checkOutDate: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return null;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional().nullable()),
});

export const updateFamilySchema = createFamilySchema.partial().extend({
  checkInDate: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal masuk hunian wajib diisi'
        : 'Format tanggal masuk tidak valid',
  }).optional()),
  isActive: z.boolean().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  verificationNote: z.string().optional().nullable(),
});

export const createWargaSchema = z.object({
  familyId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Kartu Keluarga wajib diisi'
        : 'ID Kartu Keluarga harus berupa angka',
  }).int().positive(),
  
  name: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama lengkap warga wajib diisi'
        : 'Nama lengkap warga harus berupa teks',
  }).min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
    
  nik: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'NIK wajib diisi'
        : 'NIK harus berupa teks',
  }).regex(nikRegex, 'NIK harus terdiri dari 16 digit angka'),
  
  birthPlace: z.string().max(50, 'Tempat lahir maksimal 50 karakter').optional().nullable(),
  
  birthDate: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return null;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional().nullable()),
  
  gender: z.enum(['L', 'P'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Jenis kelamin wajib diisi (L/P)'
        : 'Jenis kelamin tidak valid',
  }),
  
  relationship: z.enum(['Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Lainnya'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Hubungan keluarga wajib diisi'
        : 'Hubungan keluarga tidak valid',
  }),
  
  occupation: z.string().max(50, 'Pekerjaan maksimal 50 karakter').optional().nullable(),
  educationLevel: z.string().max(50, 'Pendidikan terakhir maksimal 50 karakter').optional().nullable(),
  
  phone: z.string()
    .regex(indonesianPhoneRegex, 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .or(z.literal(null)),
    
  ktpFile: z.string().max(255).optional().nullable(),
});

export const updateWargaSchema = createWargaSchema.partial().extend({
  isActive: z.boolean().optional(),
  inactiveReason: z.enum(['pindah', 'meninggal']).optional().nullable(),
});
