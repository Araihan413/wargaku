import { z } from 'zod';
import { datePreprocessor } from './common';


export const recordPaymentSchema = z.object({
  familyId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Keluarga (familyId) wajib diisi'
        : 'ID Keluarga harus berupa angka',
  }).int().positive(),
  feeRuleId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Aturan Iuran (feeRuleId) wajib diisi'
        : 'ID Aturan Iuran harus berupa angka',
  }).int().positive(),
  amountPaid: z.number().positive('Nominal pembayaran harus lebih dari 0'),
  paymentMethod: z.enum(['cash', 'transfer'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Metode pembayaran wajib dipilih'
        : 'Metode pembayaran harus cash atau transfer',
  }),
  paymentDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
});


export const createFeeRuleSchema = z.object({
  name: z.string().min(3, 'Nama aturan iuran minimal 3 karakter').max(100, 'Nama aturan maksimal 100 karakter'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().optional().default(true),
  description: z.string().optional().nullable(),
  frequency: z.enum(['monthly', 'yearly', 'once']).default('monthly'),
});

export const updateFeeRuleSchema = createFeeRuleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createIncomeSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  description: z.string().min(1, 'Keterangan wajib diisi'),
  transactionDate: z.string().or(z.date()),
  receiptFile: z.string().optional().nullable(),
});

export const updateIncomeSchema = createIncomeSchema.partial();
export const createExpenseSchema = createIncomeSchema;
export const updateExpenseSchema = updateIncomeSchema;

export const createCashTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Tipe transaksi wajib dipilih'
        : 'Tipe transaksi harus income atau expense',
  }),
  amount: z.number().positive('Nominal transaksi harus lebih dari 0'),
  category: z.string().min(1, 'Kategori transaksi wajib diisi'),
  description: z.string().min(3, 'Keterangan transaksi minimal 3 karakter'),
  transactionDate: z.preprocess(datePreprocessor, z.date()),
  proofFile: z.string().optional().nullable(),
});

export const updateCashTransactionSchema = createCashTransactionSchema.partial();
