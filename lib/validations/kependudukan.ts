import { z } from 'zod';
import {
  kkNumberRegex,
  nikRegex,
  indonesianPhoneRegex,
  toTitleCase,
  datePreprocessor,
  optionalDatePreprocessor,
} from './common';

export { kkNumberRegex, nikRegex, indonesianPhoneRegex, toTitleCase };

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
  }).optional().nullable(),
  
  headName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kepala Keluarga wajib diisi'
        : 'Nama Kepala Keluarga harus berupa teks',
  }).min(2, 'Nama Kepala Keluarga minimal 2 karakter')
    .max(100, 'Nama Kepala Keluarga maksimal 100 karakter')
    .optional().nullable(),
    
  unitNumber: z.string().max(10, 'Nomor unit maksimal 10 karakter').optional().nullable(),
  kkFile: z.string().max(255).optional().nullable(),
  
  checkInDate: z.preprocess(datePreprocessor, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal masuk hunian wajib diisi'
        : 'Format tanggal masuk tidak valid',
  }).optional()),
  
  checkOutDate: z.preprocess(optionalDatePreprocessor, z.date().optional().nullable()),
});

export const createFamilyWithHeadSchema = z.object({
  dwellingId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'Hunian wajib dipilih'
        : 'ID hunian harus berupa angka',
  }).int().positive('Hunian tidak valid'),
  familyNumber: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nomor Kartu Keluarga wajib diisi'
        : 'Nomor Kartu Keluarga harus berupa teks',
  }).regex(kkNumberRegex, 'Nomor Kartu Keluarga harus terdiri dari 16 digit angka'),
  headUserId: z.string().optional().nullable(),
  kkFile: z.string().max(255).optional().nullable(),
  headNik: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'NIK Kepala Keluarga wajib diisi'
        : 'NIK Kepala Keluarga harus berupa teks',
  }).regex(nikRegex, 'NIK Kepala Keluarga harus 16 digit angka'),
  headName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kepala Keluarga wajib diisi'
        : 'Nama Kepala Keluarga harus berupa teks',
  }).min(2, 'Nama Kepala Keluarga minimal 2 karakter').max(100, 'Nama Kepala Keluarga maksimal 100 karakter'),
  headPhone: z.string().regex(indonesianPhoneRegex, 'Nomor HP tidak valid').optional().nullable().or(z.literal('')),
  headGender: z.enum(['L', 'P'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Jenis kelamin Kepala Keluarga wajib dipilih (L/P)'
        : 'Jenis kelamin tidak valid',
  }),
  headBirthPlace: z.string().max(50).optional().nullable(),
  headBirthDate: z.preprocess(optionalDatePreprocessor, z.date().optional().nullable()),
  headOccupation: z.string().max(50).optional().nullable(),
  headEducationLevel: z.string().max(50).optional().nullable(),
  headKtpFile: z.string().max(255).optional().nullable(),
});

export const setupMyFamilySchema = z.object({
  dwellingId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'Hunian wajib dipilih'
        : 'ID hunian harus berupa angka',
  }).int().positive('Hunian tidak valid'),
  familyNumber: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nomor Kartu Keluarga wajib diisi'
        : 'Nomor Kartu Keluarga harus berupa teks',
  }).regex(kkNumberRegex, 'Nomor Kartu Keluarga harus 16 digit angka'),
  nik: z.string().regex(nikRegex, 'NIK harus 16 digit angka').optional().nullable().or(z.literal('')),
  kkFile: z.string().max(255).optional().nullable(),
});

export const claimWargaSchema = z.object({
  dwellingId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'Alamat hunian wajib dipilih'
        : 'ID hunian harus berupa angka',
  }).int().positive('Alamat hunian tidak valid'),
  familyNumber: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nomor Kartu Keluarga wajib diisi'
        : 'Nomor Kartu Keluarga harus berupa teks',
  }).regex(kkNumberRegex, 'Nomor Kartu Keluarga harus 16 digit angka'),
  nik: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'NIK Kepala Keluarga wajib diisi'
        : 'NIK Kepala Keluarga harus berupa teks',
  }).regex(nikRegex, 'NIK Kepala Keluarga harus 16 digit angka'),
  gender: z.enum(['L', 'P']).optional().default('L'),
});


export const updateChangeRequestDraftSchema = z.object({
  familyNumber: z.string().regex(kkNumberRegex, 'Nomor Kartu Keluarga harus 16 digit angka').optional().nullable(),
  kkFile: z.string().max(255).optional().nullable(),
  members: z.array(z.record(z.string(), z.any())).optional().default([]),
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
  verificationStatus: z.enum(['draft', 'pending', 'verified', 'rejected']).optional(),
  verificationNote: z.string().optional().nullable(),
  hasVerified: z.boolean().optional(),
  lastVerifiedAt: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional().nullable()),
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
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .transform((val) => toTitleCase(val)),
    
  nik: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'NIK wajib diisi'
        : 'NIK harus berupa teks',
  }).regex(nikRegex, 'NIK harus terdiri dari 16 digit angka'),
  
  birthPlace: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Tempat lahir wajib diisi'
        : 'Tempat lahir harus berupa teks',
  }).min(2, 'Tempat lahir minimal 2 karakter')
    .max(50, 'Tempat lahir maksimal 50 karakter')
    .transform((val) => toTitleCase(val)),
  
  birthDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal lahir wajib diisi'
        : 'Format tanggal lahir tidak valid',
  })),
  
  gender: z.enum(['L', 'P'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Jenis kelamin wajib diisi (L/P)'
        : 'Jenis kelamin tidak valid',
  }),
  
  relationship: z.enum(['Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Mertua', 'Sepupu', 'Lainnya'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Hubungan keluarga wajib diisi'
        : 'Hubungan keluarga tidak valid',
  }),
  
  occupation: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Pekerjaan wajib diisi'
        : 'Pekerjaan harus berupa teks',
  }).min(1, 'Pekerjaan wajib diisi').max(50, 'Pekerjaan maksimal 50 karakter'),
  
  educationLevel: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Pendidikan terakhir wajib dipilih'
        : 'Pendidikan terakhir harus berupa teks',
  }).min(1, 'Pendidikan terakhir wajib dipilih').max(50, 'Pendidikan terakhir maksimal 50 karakter'),
  
  religion: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Agama wajib dipilih'
        : 'Agama tidak valid',
  }),
  
  phone: z.string()
    .regex(indonesianPhoneRegex, 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .or(z.literal(null)),
    
  isKtpSameVillage: z.boolean().default(true),
  ktpAddress: z.string().max(255, 'Alamat KTP maksimal 255 karakter').optional().nullable().or(z.literal('')),
  ktpFile: z.string().max(255).optional().nullable(),
});

export const updateWargaSchema = createWargaSchema.partial().extend({
  isActive: z.boolean().optional(),
  inactiveNote: z.string().optional().nullable(),
});

export const transferFamilyMemberSchema = z.object({
  memberId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Anggota wajib diisi'
        : 'ID Anggota harus berupa angka',
  }).int().positive(),
  relationship: z.enum(['Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Mertua', 'Sepupu', 'Lainnya'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Hubungan keluarga baru wajib diisi'
        : 'Hubungan keluarga tidak valid',
  }),
  createNewFamily: z.boolean({
    error: (issue) =>
      issue.input === undefined
        ? 'Status pembuatan KK baru wajib diisi'
        : 'Status pembuatan KK baru tidak valid',
  }),
  targetFamilyId: z.number().int().positive().optional().nullable(),
  familyNumber: z.preprocess((arg) => (arg === '' ? null : arg), z.string().regex(kkNumberRegex, 'Nomor Kartu Keluarga harus terdiri dari 16 digit angka').optional().nullable()),
  dwellingId: z.number().int().positive().optional().nullable(),
  unitNumber: z.string().max(10, 'Nomor unit maksimal 10 karakter').optional().nullable(),
  checkInDate: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional()),
});

export const changeFamilyHeadSchema = z.object({
  newHeadMemberId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Kepala Keluarga baru wajib diisi'
        : 'ID Kepala Keluarga baru harus berupa angka',
  }).int().positive(),
});

export type ChangeFamilyHeadInput = z.infer<typeof changeFamilyHeadSchema>;


