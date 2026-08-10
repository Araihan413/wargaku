import { z } from "zod";

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
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp/HP harus berupa 10-15 digit angka"),
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
    if (!data.nik || !/^\d{16}$/.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NIK harus terdiri dari 16 digit angka",
        path: ["nik"],
      });
    }
    if (!data.familyNumber || !/^\d{16}$/.test(data.familyNumber)) {
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

