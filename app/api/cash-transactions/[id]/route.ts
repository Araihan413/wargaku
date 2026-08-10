import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  getCashTransactionById,
  updateCashTransaction,
  deleteCashTransaction,
  updateIncomeSchema,
} from '@/db/queries/finance/cash.queries';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @openapi
 * /api/cash-transactions/{id}:
 *   get:
 *     summary: Mendapatkan detail transaksi kas RT berdasarkan ID
 *     description: Mengambil data detail transaksi kas. Bisa diakses oleh pengguna yang login.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi kas
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail transaksi
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Transaksi tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const item = await getCashTransactionById(id);

    if (!item) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error in GET /api/cash-transactions/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/cash-transactions/{id}:
 *   put:
 *     summary: Memperbarui data transaksi kas RT
 *     description: Mengubah data transaksi kas. Membutuhkan hak akses manage-income (jika transaksi income) atau manage-expense (jika transaksi expense).
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi kas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       200:
 *         description: Transaksi berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Transaksi tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = await getCashTransactionById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const currentRoleId = await getEffectiveRoleId(session);
    const permKey = existing.type === 'expense' ? 'manage-expense' : 'manage-income';
    const isAllowed = await hasPermission(currentRoleId, permKey);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateIncomeSchema.parse(body);

    await updateCashTransaction(id, {
      ...validated,
      amount: validated.amount ? Number(validated.amount) : undefined,
      transactionDate: validated.transactionDate ? new Date(validated.transactionDate) : undefined,
    });

    return NextResponse.json({ message: 'Transaksi berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    console.error('Error in PUT /api/cash-transactions/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/cash-transactions/{id}:
 *   delete:
 *     summary: Menghapus data transaksi kas RT
 *     description: Menghapus transaksi dari buku kas. Membutuhkan hak akses manage-income atau manage-expense sesuai jenis transaksinya.
 *     tags:
 *       - Iuran & Keuangan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi kas
 *     responses:
 *       200:
 *         description: Transaksi berhasil dihapus
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Transaksi tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = await getCashTransactionById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const currentRoleId = await getEffectiveRoleId(session);
    const permKey = existing.type === 'expense' ? 'manage-expense' : 'manage-income';
    const isAllowed = await hasPermission(currentRoleId, permKey);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    await deleteCashTransaction(id);

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/cash-transactions/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
