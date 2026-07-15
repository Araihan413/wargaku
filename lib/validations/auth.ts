import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
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
  nik: z
    .string()
    .min(1, "NIK wajib diisi")
    .regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka"),
  familyNumber: z
    .string()
    .min(1, "Nomor Kartu Keluarga wajib diisi")
    .regex(/^\d{16}$/, "Nomor Kartu Keluarga (KK) harus terdiri dari 16 digit angka"),
  isManualDwelling: z.boolean(),
  dwellingId: z.string().optional(),
  streetName: z.string().optional(),
  blockNumber: z.string().optional(),
  houseNumber: z.string().optional(),
  unitNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  // Pengecekan kecocokan password
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Konfirmasi password tidak cocok",
      path: ["confirmPassword"],
    });
  }

  // Pengecekan validasi alamat kondisional
  if (!data.isManualDwelling) {
    if (!data.dwellingId || data.dwellingId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Silakan pilih alamat rumah Anda atau pilih opsi Input Manual",
        path: ["dwellingId"],
      });
    }
  } else {
    if (!data.streetName || data.streetName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nama Jalan/Gang wajib diisi untuk alamat manual",
        path: ["streetName"],
      });
    }
  }
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
