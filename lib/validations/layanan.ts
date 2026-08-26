import { z } from 'zod';
import { indonesianPhoneRegex, datePreprocessor, optionalDatePreprocessor } from './common';

// ==========================================
// PENGADUAN (COMPLAINTS)
// ==========================================
export const createComplaintSchema = z.object({
  reporterName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nama pelapor wajib diisi'
        : 'Nama pelapor harus berupa teks',
  }).min(2, 'Nama pelapor minimal 2 karakter').max(100, 'Nama pelapor maksimal 100 karakter'),

  reporterPhone: z.string()
    .regex(indonesianPhoneRegex, 'Nomor telepon tidak valid. Gunakan format Indonesia (misal: 081234567890)')
    .optional()
    .nullable()
    .or(z.literal('')),

  category: z.enum(['Infrastruktur', 'Kebersihan', 'Keamanan', 'Sosial', 'Lainnya'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Kategori pengaduan wajib dipilih'
        : 'Kategori pengaduan tidak valid (Infrastruktur, Kebersihan, Keamanan, Sosial, Lainnya)',
  }),

  description: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Rincian pengaduan wajib diisi'
        : 'Rincian pengaduan harus berupa teks',
  }).min(5, 'Rincian pengaduan minimal 5 karakter').max(2000, 'Rincian pengaduan maksimal 2000 karakter'),

  photoPath: z.string().max(255).optional().nullable(),
  dwellingId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().int().positive().optional().nullable()
  ),
  turnstileToken: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Verifikasi Turnstile keamanan wajib ada'
        : 'Token Turnstile tidak valid',
  }).optional().nullable(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(['menunggu', 'proses', 'selesai', 'ditolak'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Status pengaduan wajib dipilih'
        : 'Status pengaduan tidak valid (menunggu, proses, selesai, ditolak)',
  }),
  responseNote: z.string().max(1000).optional().nullable(),
});


// ==========================================
// PENGUMUMAN (ANNOUNCEMENTS)
// ==========================================
export const createAnnouncementSchema = z.object({
  title: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Judul pengumuman wajib diisi'
        : 'Judul pengumuman harus berupa teks',
  }).min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),

  content: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Isi pengumuman wajib diisi'
        : 'Isi pengumuman harus berupa teks',
  }).min(5, 'Isi pengumuman minimal 5 karakter'),

  category: z.enum(['umum', 'penting', 'mendesak'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Kategori pengumuman wajib dipilih'
        : 'Kategori tidak valid (harus umum, penting, atau mendesak)',
  }),

  attachments: z.string().optional().nullable().or(z.array(z.string()).transform((arr) => JSON.stringify(arr))).optional().nullable(),
  isPinned: z.boolean().optional().default(false),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  isPinned: z.boolean().optional(),
});

// ==========================================
// KEGIATAN RT (ACTIVITIES)
// ==========================================
export const createActivitySchema = z.object({
  title: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Judul kegiatan wajib diisi'
        : 'Judul kegiatan harus berupa teks',
  }).min(3, 'Judul kegiatan minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),

  description: z.string().optional().nullable(),

  eventDate: z.preprocess(datePreprocessor, z.date({
    error: (issue) =>
      issue.input === undefined
        ? 'Tanggal dan waktu kegiatan wajib diisi'
        : 'Format tanggal kegiatan tidak valid',
  })),

  location: z.string().max(200).optional().nullable(),
  attachments: z.string().optional().nullable().or(z.array(z.string()).transform((arr) => JSON.stringify(arr))).optional().nullable(),
});

export const updateActivitySchema = createActivitySchema.partial();

// ==========================================
// BROADCAST SISTEM
// ==========================================
export const createBroadcastSchema = z.object({
  title: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Judul broadcast wajib diisi'
        : 'Judul broadcast harus berupa teks',
  }).min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),

  message: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'Pesan broadcast wajib diisi'
        : 'Pesan broadcast harus berupa teks',
  }).min(5, 'Pesan broadcast minimal 5 karakter'),

  type: z.enum(['info', 'maintenance', 'feature', 'warning']).default('info'),
  sendPush: z.boolean().optional().default(false),
  sendInAppNotif: z.boolean().optional().default(true),
  expiresAt: z.preprocess(optionalDatePreprocessor, z.date().optional().nullable()),
});

export const updateBroadcastSchema = createBroadcastSchema.partial().extend({
  isActive: z.boolean().optional(),
});


