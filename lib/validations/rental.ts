import { z } from 'zod';

const nikRegex = /^[0-9]{16}$/;
const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

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
      .regex(indonesianPhoneRegex, 'Nomor HP/WhatsApp koordinator tidak valid. Gunakan format Indonesia (misal: 081234567890)')
      .optional()
      .nullable()
      .or(z.literal(''))
      .or(z.literal(null))
  ),
  contactPerson: z.string().max(100, 'Nama kontak maksimal 100 karakter').optional().nullable(),
  
  phone: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/[-\s]/g, '') : val),
    z.string()
      .regex(indonesianPhoneRegex, 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)')
      .optional()
      .nullable()
      .or(z.literal(''))
      .or(z.literal(null))
  ),
  
  totalRooms: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'Total kamar wajib diisi'
        : 'Total kamar harus berupa angka',
  }).int().nonnegative('Total kamar tidak boleh negatif').default(0),
});

export const updateRentalPropertySchema = createRentalPropertySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createRentalResidentSchema = z.object({
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
  
  phone: z.string()
    .regex(indonesianPhoneRegex, 'Nomor HP/WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .or(z.literal(null)),
    
  originAddress: z.string().optional().nullable(),
  occupation: z.string().max(50, 'Pekerjaan maksimal 50 karakter').optional().nullable(),
  educationLevel: z.string().max(50, 'Pendidikan terakhir maksimal 50 karakter').optional().nullable(),
  religion: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']).optional().nullable(),
  roomNumber: z.string().max(10, 'Nomor kamar maksimal 10 karakter').optional().nullable(),
  
  checkInDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal check-in wajib diisi'
        : 'Format tanggal check-in tidak valid',
  })),
  
  ktpFile: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Scan KTP wajib diunggah untuk anak kos'
        : 'Scan KTP harus berupa teks',
  }).min(1, 'Scan KTP wajib diunggah untuk anak kos').max(255),
});

export const updateRentalResidentSchema = createRentalResidentSchema.partial().extend({
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  verificationNote: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  inactiveReason: z.enum(['pindah', 'meninggal']).optional().nullable(),
  checkOutDate: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return null;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional().nullable()),
});

export const checkOutResidentSchema = z.object({
  checkOutDate: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal check-out wajib diisi'
        : 'Format tanggal check-out tidak valid',
  })),
  
  inactiveReason: z.enum(['pindah', 'meninggal'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Alasan tidak aktif wajib diisi'
        : 'Alasan tidak aktif tidak valid',
  }),
});
