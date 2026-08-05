import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { recordPayment } from '@/db/queries/finance/fee.queries';
import { notifyUser } from '@/lib/notifications';
import { z } from 'zod';

const payIuranSchema = z.object({
  amountPaid: z.number().positive('Nominal pembayaran harus lebih dari 0'),
  paymentMethod: z.enum(['cash', 'transfer']),
  paymentDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mencatat pembayaran iuran' }, { status: 403 });
    }

    const resolvedParams = await params;
    const paymentId = parseInt(resolvedParams.id, 10);
    if (isNaN(paymentId)) {
      return NextResponse.json({ error: 'ID tagihan iuran tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = payIuranSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    const result = await recordPayment(paymentId, parsed.data, session.user.id);

    // Kirim notifikasi personal ke kepala keluarga jika terhubung ke user
    if (result.headUserId) {
      const statusText = result.newStatus === 'paid' ? 'Lunas' : 'Sebagian';
      notifyUser(result.headUserId, {
        title: `Pembayaran Iuran ${result.ruleName}`,
        message: `Pembayaran iuran ${result.ruleName} periode ${result.period} telah dicatat (${statusText}). Sisa tagihan: Rp ${result.amountDue.toLocaleString('id-ID')}.`,
        category: 'personal',
        redirectLink: '/dashboard/finance',
      }).catch((notifErr: any) => console.error('Gagal kirim notifikasi bayar iuran:', notifErr));
    }

    return NextResponse.json({
      message: 'Pembayaran iuran berhasil dicatat dan disinkronkan ke Kas RT',
      data: result,
    });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Tagihan iuran tidak ditemukan' }, { status: 404 });
    }
    if (err.message === 'ALREADY_PAID') {
      return NextResponse.json({ error: 'Tagihan iuran ini sudah lunas' }, { status: 400 });
    }
    if (err.message?.startsWith('OVERPAY:')) {
      const remaining = err.message.split(':')[1];
      return NextResponse.json({ error: `Nominal bayar melebihi sisa tagihan (Rp ${Number(remaining).toLocaleString('id-ID')})` }, { status: 400 });
    }
    console.error('[POST /api/fee-payments/[id]/pay]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
