import { z } from "zod";
import { nikRegex, kkNumberRegex, indonesianPhoneRegex } from "./common";

export const createUserByAdminSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ? "Nama wajib diisi" : "Nama harus berupa teks"
  }).min(2, "Nama minimal terdiri dari 2 karakter").max(100, "Nama maksimal 100 karakter"),
  
  email: z.string({
    error: (issue) => issue.input === undefined ? "Email wajib diisi" : "Email harus berupa teks"
  }).email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  
  roles: z.array(z.number({
    error: (issue) => issue.input === undefined ? "Role harus berupa angka" : "Role tidak valid"
  })).min(1, "Minimal pilih 1 peran (role)"),
  
  status: z.enum(["pending", "active", "suspended"]),


  nik: z.string().optional().or(z.literal("")),
  phone: z.string().regex(indonesianPhoneRegex, "Nomor telepon tidak valid").optional().or(z.literal("")),
  
  // Fields Warga (Role 6)
  familyNumber: z.string().optional().nullable().or(z.literal("")),
  dwellingId: z.number().optional().nullable(),
  unitNumber: z.string().optional().nullable().or(z.literal("")),
  gender: z.enum(["L", "P"]).optional().nullable(),

  // Field Koordinator Kos (Role 5)
  rentalPropertyId: z.number().optional().nullable(),
}).superRefine((data, ctx) => {
  // 1. Super Admin (1) harus eksklusif
  if (data.roles.includes(1) && data.roles.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["roles"],
      message: "Role Super Admin tidak dapat digabungkan dengan role lain.",
    });
  }

  // 2. Anti Pengurus Ganda (Ketua RT: 2, Sekretaris: 3, Bendahara: 4)
  const officerRoles = data.roles.filter((r) => [2, 3, 4].includes(r));
  if (officerRoles.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["roles"],
      message: "Tidak dapat memilih lebih dari satu jabatan pengurus (Ketua RT, Sekretaris, Bendahara) sekaligus.",
    });
  }

  // 3. Jika ada role Warga (6), wajib NIK (16 digit), Nomor KK (16 digit), dan Alamat Hunian
  if (data.roles.includes(6)) {
    if (!data.nik || data.nik.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK wajib diisi untuk peran Warga",
      });
    } else if (!nikRegex.test(data.nik.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK harus terdiri dari 16 digit angka",
      });
    }

    if (!data.familyNumber || data.familyNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["familyNumber"],
        message: "Nomor Kartu Keluarga (KK) wajib diisi untuk peran Warga",
      });
    } else if (!kkNumberRegex.test(data.familyNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["familyNumber"],
        message: "Nomor KK harus terdiri dari 16 digit angka",
      });
    }

    if (!data.dwellingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dwellingId"],
        message: "Alamat Hunian wajib dipilih untuk peran Warga",
      });
    }
  }


  // 4. Jika ada role Koordinator Kos (5), Properti Kos wajib dipilih
  if (data.roles.includes(5)) {
    if (!data.rentalPropertyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentalPropertyId"],
        message: "Properti Kos wajib dipilih untuk role Koordinator Kos",
      });
    }
  }
});

export type CreateUserByAdminType = z.infer<typeof createUserByAdminSchema>;

export const createUserSchema = createUserByAdminSchema;
export type CreateUserType = CreateUserByAdminType;
export type CreateUserInput = CreateUserByAdminType;

export const updateUserSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ? "Nama wajib diisi" : "Nama harus berupa teks"
  }).min(2, "Nama minimal terdiri dari 2 karakter").max(100, "Nama maksimal 100 karakter"),
  
  email: z.string({
    error: (issue) => issue.input === undefined ? "Email wajib diisi" : "Email harus berupa teks"
  }).email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  
  phone: z.string()
    .regex(indonesianPhoneRegex, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  
  roleId: z.number({
    error: (issue) => issue.input === undefined ? "Role wajib dipilih" : "Role harus berupa angka"
  }).int().positive(),
});

export type UpdateUserType = z.infer<typeof updateUserSchema>;
export type UpdateUserInput = UpdateUserType;

