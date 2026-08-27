import { z } from 'zod';
import {
  nikRegex,
  indonesianPhoneRegex,
  datePreprocessor,
  optionalDatePreprocessor,
} from './common';

export const createRentalPropertySchema = z.object({
  dwellingId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID tempat tinggal wajib diisi'
        : 'ID tempat tinggal harus berupa angka',
  }).int().positive('ID tempat tinggal tidak valid'),
  
  name: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama properti sewa wajib diisi'
        : 'Nama properti sewa harus berupa teks',
  }).min(2, 'Nama properti minimal 2 karakter')
    .max(100, 'Nama properti maksimal 100 karakter'),
    
  coordinatorUserId: z.string().optional().nullable(),
  coordinatorName: z.string().max(100, 'Nama koordinator maksimal 100 karakter').optional().nullable(),
  coordinatorPhone: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/[-\s]/g, '') : val),
    z.string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || indonesianPhoneRegex.test(val),
        { message: 'Nomor HP/WhatsApp koordinator tidak valid. Gunakan format Indonesia (misal: 081234567890)' }
      )
  ),
  contactPerson: z.string().max(100, 'Nama kontak maksimal 100 karakter').optional().nullable(),
  
  phone: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/[-\s]/g, '') : val),
    z.string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || indonesianPhoneRegex.test(val),
        { message: 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)' }
      )
  ),
  
  totalRooms: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'Total kamar wajib diisi'
        : 'Total kamar harus berupa angka',
  }).int().nonnegative('Total kamar tidak boleh negatif').default(0),
  occupiedRooms: z.number().int().nonnegative('Jumlah kamar terisi tidak boleh negatif').default(0).optional(),
  notes: z.string().optional().nullable(),
});

export const updateRentalPropertySchema = createRentalPropertySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createRentalResidentBaseSchema = z.object({
  tenantType: z.enum(['perorangan', 'keluarga'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Tipe penyewa wajib diisi'
        : 'Tipe penyewa tidak valid',
  }),
  
  familyId: z.number().int().positive().optional().nullable(),
  
  name: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama penyewa wajib diisi'
        : 'Nama penyewa harus berupa teks',
  }).min(2, 'Nama penyewa minimal 2 karakter')
    .max(100, 'Nama penyewa maksimal 100 karakter'),
    
  nik: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'NIK wajib diisi'
        : 'NIK harus berupa teks',
  }).regex(nikRegex, 'NIK harus terdiri dari 16 digit angka'),
  
  phone: z.preprocess(
    (val) => (typeof val === 'string' ? (val.trim() === '' ? null : val.replace(/[-\s]/g, '')) : val),
    z.string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || indonesianPhoneRegex.test(val),
        { message: 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)' }
      )
  ),

  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email('Format email tidak valid').optional().nullable()
  ),
  
  checkInDate: z.preprocess(datePreprocessor, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal check-in wajib diisi'
        : 'Format tanggal check-in tidak valid',
  })),
  
  isKtpSameVillage: z.boolean().default(false).optional(),
  ktpAddress: z.preprocess((val) => (val === '' ? null : val), z.string().max(255).optional().nullable()),
  ktpFile: z.preprocess((val) => (val === '' ? null : val), z.string().max(255).optional().nullable()),
  notes: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
  autoDeductVacantRoom: z.boolean().default(true).optional(),
});

export const createRentalResidentSchema = createRentalResidentBaseSchema
  .refine((data) => {
    if (data.tenantType === 'perorangan' && (!data.ktpFile || data.ktpFile.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Scan KTP wajib diunggah untuk tipe sewa perorangan',
    path: ['ktpFile'],
  })
  .refine((data) => {
    if (data.tenantType === 'keluarga' && (!data.email || data.email.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga',
    path: ['email'],
  });

export const updateRentalResidentSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').max(100).optional().nullable(),
  nik: z.string().length(16, 'NIK harus 16 digit angka').optional().nullable(),
  phone: z.string().optional().nullable(),
  isKtpSameVillage: z.boolean().optional(),
  ktpAddress: z.preprocess((val) => (val === '' ? null : val), z.string().max(255).optional().nullable()),
  ktpFile: z.string().optional().nullable(),
  checkInDate: z.preprocess(optionalDatePreprocessor, z.date().optional().nullable()),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  verificationNote: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  inactiveReason: z.enum(['pindah', 'meninggal']).optional().nullable(),
  checkOutDate: z.preprocess(optionalDatePreprocessor, z.date().optional().nullable()),
  notes: z.string().optional().nullable(),
});

export const checkoutRentalResidentSchema = z.object({
  checkOutDate: z.preprocess(datePreprocessor, z.date().optional()),
  checkOutNote: z.string().max(500).optional().nullable(),
});

export const reactivateRentalResidentSchema = z.object({
  checkInDate: z.preprocess(datePreprocessor, z.date().optional()),
});

export const resubmitRentalResidentSchema = z.object({
  individualName: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  individualNik: z.string().regex(nikRegex, 'NIK harus 16 digit angka').optional(),
  individualPhone: z.string().optional().nullable(),
  individualKtpFile: z.string().optional().nullable(),
  isKtpSameVillage: z.boolean().optional(),
  ktpAddress: z.string().optional().nullable(),
});

export const resendInvitationSchema = z.object({
  contractId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Kontrak wajib diisi'
        : 'ID Kontrak harus berupa angka',
  }).int().positive(),
});

export const createCoordinatorSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional().nullable(),
  dwellingId: z.number().int(),
});

