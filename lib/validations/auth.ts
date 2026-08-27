import { z } from "zod";
import { nikRegex, kkNumberRegex, indonesianPhoneRegex } from "./common";

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  // Tipe Akun
  accountType: z.enum(["warga", "coordinator"]),

  // Step 1: Akun & Kontak
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z
    .string()
    .min(1, "Nomor WhatsApp / HP wajib diisi")
    .regex(indonesianPhoneRegex, "Nomor WhatsApp/HP harus berupa format Indonesia yang valid (10-15 digit)"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),

  // Step 2: Kependudukan
  name: z.string().min(1, "Nama Lengkap wajib diisi"),
  nik: z.string().optional(),
  familyNumber: z
    .string()
    .optional(),
  dwellingId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Pengecekan kecocokan password
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Konfirmasi password tidak cocok",
      path: ["confirmPassword"],
    });
  }

  // Pengecekan data kependudukan jika tipe akun Warga
  if (data.accountType === "warga") {
    if (!data.nik || !nikRegex.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NIK harus terdiri dari 16 digit angka",
        path: ["nik"],
      });
    }
    if (!data.familyNumber || !kkNumberRegex.test(data.familyNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor Kartu Keluarga (KK) harus terdiri dari 16 digit angka",
        path: ["familyNumber"],
      });
    }
    if (!data.dwellingId || data.dwellingId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alamat rumah wajib dipilih",
        path: ["dwellingId"],
      });
    }
  }
});

export const completeRegistrationSchema = z.object({
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
        ? 'NIK wajib diisi'
        : 'NIK harus berupa teks',
  }).regex(nikRegex, 'NIK harus 16 digit angka'),
});

export const coordRegisterSchema = z.object({
  id: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'ID sementara wajib ada'
        : 'ID sementara tidak valid',
  }).min(1, 'ID sementara wajib ada'),
  email: z.string().email('Format email tidak valid'),
  nik: z.string().regex(nikRegex, 'NIK harus 16 digit angka'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  phone: z.string().regex(indonesianPhoneRegex, 'Format nomor telepon tidak valid (contoh: 08123456789)').optional().or(z.literal('')),
});

export const activateTenantAccountSchema = z.object({
  token: z.string({
    error: (issue) =>
      issue.input === undefined ? 'Token aktivasi wajib diisi' : 'Token aktivasi tidak valid',
  }).min(1, 'Token aktivasi wajib diisi'),
  familyNumber: z.string({
    error: (issue) =>
      issue.input === undefined ? 'Nomor KK wajib diisi' : 'Nomor KK harus berupa teks',
  }).regex(kkNumberRegex, 'Nomor KK harus terdiri dari 16 digit angka'),
  kkFile: z.string().optional().nullable(),
  password: z.string({
    error: (issue) =>
      issue.input === undefined ? 'Password wajib diisi' : 'Password tidak valid',
  }).min(8, 'Password minimal 8 karakter'),
});




export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


