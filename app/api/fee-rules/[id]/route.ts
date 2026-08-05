import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { updateFeeRule, deleteFeeRule } from '@/db/queries/finance/fee.queries';
import { z } from 'zod';

const updateFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().default(true),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengedit aturan iuran' }, { status: 403 });
    }

    const resolvedParams = await params;
    const ruleId = parseInt(resolvedParams.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'ID aturan iuran tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    await updateFeeRule(ruleId, parsed.data);
    return NextResponse.json({ message: 'Aturan iuran berhasil diperbarui' });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan' }, { status: 404 });
    }
    console.error('[PUT /api/fee-rules/[id]]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk menghapus aturan iuran' }, { status: 403 });
    }

    const resolvedParams = await params;
    const ruleId = parseInt(resolvedParams.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'ID aturan iuran tidak valid' }, { status: 400 });
    }

    const result = await deleteFeeRule(ruleId);
    if (result.softDeleted) {
      return NextResponse.json({
        message: 'Aturan iuran dinonaktifkan karena sudah memiliki riwayat pembayaran warga.',
        softDeleted: true,
      });
    }
    return NextResponse.json({ message: 'Aturan iuran berhasil dihapus', softDeleted: false });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Aturan iuran tidak ditemukan' }, { status: 404 });
    }
    console.error('[DELETE /api/fee-rules/[id]]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
