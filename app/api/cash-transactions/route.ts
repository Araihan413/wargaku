import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  listCashTransactions,
  createCashTransaction,
  createIncomeSchema,
  createExpenseSchema,
  createAuditLog,
} from '@/db/queries';
import { getClientIp } from '@/lib/audit-logger';
import { z } from 'zod';

/**
 * @openapi
 * /api/cash-transactions:
 *   get:
 *     summary: Mendapatkan daftar transaksi kas RT
 *     description: Mengambil daftar pemasukan (income) atau pengeluaran (expense) kas RT dengan dukungan pagination dan filter.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *           default: income
 *         description: Tipe transaksi
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter kategori transaksi
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal awal filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir filter
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian deskripsi transaksi
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar transaksi kas
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type') || 'income';
    const type = typeParam === 'expense' ? 'expense' : 'income';
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('query') || searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await listCashTransactions({
      type,
      category,
      query: search,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/cash-transactions:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/cash-transactions:
 *   post:
 *     summary: Mencatat transaksi kas RT (Pemasukan / Pengeluaran)
 *     description: Mencatat transaksi baru ke dalam buku kas RT. Membutuhkan hak akses manage-income (untuk pemasukan) atau manage-expense (untuk pengeluaran).
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - transactionDate
 *               - category
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *               transactionDate:
 *                 type: string
 *                 format: date
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               receiptFile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi kas berhasil ditambahkan
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses untuk tipe transaksi ini
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type === 'expense' ? 'expense' : 'income';

    const effectiveRoleId = await getEffectiveRoleId(session);
    const permKey = type === 'expense' ? 'manage-expense' : 'manage-income';
    const isAllowed = await hasPermission(effectiveRoleId, permKey);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const schema = type === 'expense' ? createExpenseSchema : createIncomeSchema;
    const validated = schema.parse(body);

    const insertedId = await createCashTransaction({
      type,
      amount: Number(validated.amount),
      transactionDate: new Date(validated.transactionDate),
      category: validated.category,
      description: validated.description,
      receiptFile: validated.receiptFile,
      createdBy: session.user.id,
    });

    const ipAddress = (await getClientIp(request)) || undefined;
    await createAuditLog({
      userId: session.user.id,
      action: type === 'expense' ? 'CREATE_KAS_EXPENSE' : 'CREATE_KAS_INCOME',
      module: 'kas',
      description: `Mencatat ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} Kas RT sebesar Rp ${Number(
        validated.amount
      ).toLocaleString('id-ID')} (Kategori: ${validated.category})`,
      ipAddress,
    });

    return NextResponse.json(
      { message: `Data ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} berhasil ditambahkan`, id: insertedId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    console.error('Error in POST /api/cash-transactions:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
