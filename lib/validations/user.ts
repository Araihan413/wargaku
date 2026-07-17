import { z } from "zod";

const nikRegex = /^[0-9]{16}$/;
const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

export const createUserSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ? "Nama wajib diisi" : "Nama harus berupa teks"
  }).min(2, "Nama minimal terdiri dari 2 karakter").max(100, "Nama maksimal 100 karakter"),
  
  email: z.string({
    error: (issue) => issue.input === undefined ? "Email wajib diisi" : "Email harus berupa teks"
  }).email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  
  password: z.string({
    error: (issue) => issue.input === undefined ? "Password wajib diisi" : "Password harus berupa teks"
  }).min(6, "Password minimal terdiri dari 6 karakter").max(100, "Password maksimal 100 karakter"),
  
  nik: z.string()
    .optional()
    .or(z.literal("")),
  
  phone: z.string()
    .regex(indonesianPhoneRegex, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  
  roleId: z.number({
    error: (issue) => issue.input === undefined ? "Role wajib dipilih" : "Role harus berupa angka"
  }).int().positive(),
  
  status: z.enum(["pending", "active", "suspended"]),
}).superRefine((data, ctx) => {
  // Jika perannya bukan Super Admin (roleId != 1), maka NIK wajib diisi dan harus tepat 16 digit angka
  if (data.roleId !== 1) {
    if (!data.nik || data.nik.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK wajib diisi untuk peran selain Super Admin",
      });
    } else if (!nikRegex.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK harus terdiri dari 16 digit angka",
      });
    }
  } else {
    // Untuk Super Admin, jika NIK diisi, tetap harus valid 16 digit
    if (data.nik && data.nik.trim() !== "" && !nikRegex.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK harus terdiri dari 16 digit angka jika diisi",
      });
    }
  }
});

export type CreateUserType = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ? "Nama wajib diisi" : "Nama harus berupa teks"
  }).min(2, "Nama minimal terdiri dari 2 karakter").max(100, "Nama maksimal 100 karakter"),
  
  email: z.string({
    error: (issue) => issue.input === undefined ? "Email wajib diisi" : "Email harus berupa teks"
  }).email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  
  nik: z.string()
    .optional()
    .or(z.literal("")),
  
  phone: z.string()
    .regex(indonesianPhoneRegex, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  
  roleId: z.number({
    error: (issue) => issue.input === undefined ? "Role wajib dipilih" : "Role harus berupa angka"
  }).int().positive(),
}).superRefine((data, ctx) => {
  // Jika perannya bukan Super Admin (roleId != 1), maka NIK wajib diisi dan harus tepat 16 digit angka
  if (data.roleId !== 1) {
    if (!data.nik || data.nik.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK wajib diisi untuk peran selain Super Admin",
      });
    } else if (!nikRegex.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK harus terdiri dari 16 digit angka",
      });
    }
  } else {
    // Untuk Super Admin, jika NIK diisi, tetap harus valid 16 digit
    if (data.nik && data.nik.trim() !== "" && !nikRegex.test(data.nik)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nik"],
        message: "NIK harus terdiri dari 16 digit angka jika diisi",
      });
    }
  }
});

export type UpdateUserType = z.infer<typeof updateUserSchema>;
