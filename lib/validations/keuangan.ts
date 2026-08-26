import { z } from 'zod';
import { datePreprocessor } from './common';


export const recordPaymentSchema = z.object({
  paymentId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? 'ID Pembayaran (paymentId) wajib diisi'
        : 'ID Pembayaran harus berupa angka',
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
