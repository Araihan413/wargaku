import { z } from 'zod';

// ==========================================
// SYSTEM CONFIG / PENGATURAN RT/RW
// ==========================================
export const updateSystemConfigSchema = z.object({
  rtName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama RT wajib diisi'
        : 'Nama RT harus berupa teks',
  }).min(1, 'Nama RT wajib diisi').max(50),

  rwName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama RW wajib diisi'
        : 'Nama RW harus berupa teks',
  }).min(1, 'Nama RW wajib diisi').max(50),

  villageName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kelurahan/Desa wajib diisi'
        : 'Nama Kelurahan/Desa harus berupa teks',
  }).min(1, 'Nama Kelurahan/Desa wajib diisi').max(100),

  subdistrict: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kecamatan wajib diisi'
        : 'Nama Kecamatan harus berupa teks',
  }).min(1, 'Nama Kecamatan wajib diisi').max(100),

  city: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama Kota/Kabupaten wajib diisi'
        : 'Nama Kota/Kabupaten harus berupa teks',
  }).min(1, 'Nama Kota/Kabupaten wajib diisi').max(100),

  postalCode: z.string().max(10).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactEmail: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  appLogoUrl: z.string().max(255).optional().nullable(),
  headerLogoUrl: z.string().max(255).optional().nullable(),
  publicPortalContent: z.string().optional().nullable(),
  customSettings: z.record(z.string(), z.any()).optional().nullable(),
});

// ==========================================
// SMART GROUPS
// ==========================================
export const createSmartGroupSchema = z.object({
  name: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama kelompok warga wajib diisi'
        : 'Nama kelompok warga harus berupa teks',
  }).min(2, 'Nama kelompok minimal 2 karakter').max(100),

  description: z.string().optional().nullable(),

  criteria: z.record(z.string(), z.any(), {
    error: (issue) =>
      issue.input === undefined
        ? 'Kriteria aturan kelompok wajib diisi'
        : 'Kriteria harus berupa objek aturan yang valid',
  }),
});

export const updateSmartGroupSchema = createSmartGroupSchema.partial();

export const evaluateSmartGroupSchema = z.object({
  criteria: z.record(z.string(), z.any(), {
    error: (issue) =>
      issue.input === undefined
        ? 'Kriteria evaluasi wajib diisi'
        : 'Kriteria harus berupa objek',
  }),
});

// ==========================================
// PERMISSIONS / HAK AKSES PERAN
// ==========================================
export const updatePermissionsSchema = z.object({
  roleId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Peran (roleId) wajib diisi'
        : 'ID Peran harus berupa angka',
  }).int().positive(),

  permissionIds: z.array(z.coerce.number().int().positive(), {
    error: (issue) =>
      issue.input === undefined
        ? 'Daftar hak akses (permissionIds) wajib diisi'
        : 'Daftar hak akses harus berupa array',
  }),
});



// ==========================================
// PREFERENSI NOTIFIKASI & PROFIL
// ==========================================
export const updateNotificationPreferenceSchema = z.object({
  pushNotificationsEnabled: z.boolean({
    error: (issue) =>
      issue.input === undefined
        ? 'Nilai pushNotificationsEnabled wajib diisi'
        : 'Nilai pushNotificationsEnabled harus berupa boolean',
  }),
});


export const setPrimaryRoleSchema = z.object({
  roleId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Peran wajib diisi'
        : 'ID Peran harus berupa angka',
  }).int().positive(),
});

// ==========================================
// PERSETUJUAN / APPROVALS
// ==========================================
export const processRegistrationApprovalSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Aksi wajib dipilih (approve/reject)'
        : 'Aksi tidak valid (harus approve atau reject)',
  }),
  rejectReason: z.string().optional().nullable(),
}).refine(
  (data) => data.action !== 'reject' || (data.rejectReason && data.rejectReason.trim().length > 0),
  { message: 'Alasan penolakan wajib diisi jika menolak pendaftaran', path: ['rejectReason'] }
);

export const processDocumentApprovalSchema = z.object({
  type: z.enum(['family', 'rental_resident'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Tipe dokumen wajib diisi'
        : 'Tipe dokumen tidak valid (harus family atau rental_resident)',
  }),
  action: z.enum(['approve', 'reject'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Aksi wajib dipilih (approve/reject)'
        : 'Aksi tidak valid (harus approve atau reject)',
  }),
  rejectReason: z.string().optional().nullable(),
}).refine(
  (data) => data.action !== 'reject' || (data.rejectReason && data.rejectReason.trim().length > 0),
  { message: 'Alasan penolakan wajib diisi jika menolak berkas', path: ['rejectReason'] }
);

export const markNotificationReadSchema = z.object({
  id: z.number().int().positive().optional(),
});


