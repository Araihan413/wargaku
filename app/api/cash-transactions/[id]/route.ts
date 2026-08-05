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
