import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listPayments, recordPayment } from '@/db/queries/finance/fee.queries';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = (await hasPermission(effectiveRoleId, 'manage-iuran')) || (await hasPermission(effectiveRoleId, 'view-tunggakan'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId') ? parseInt(searchParams.get('ruleId')!, 10) : null;
    const period = searchParams.get('period') || null;
    const searchQuery = searchParams.get('query') || searchParams.get('search') || '';

    if (!ruleId) {
      return NextResponse.json({ error: 'Parameter ruleId diperlukan' }, { status: 400 });
    }

    const result = await listPayments(ruleId, period, searchQuery);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/fee-payments]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, 'manage-iuran');
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mencatat pembayaran' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, status, notes } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Data paymentId dan status wajib diisi' }, { status: 400 });
    }

    const updated = await recordPayment(paymentId, status, session.user.id);
    return NextResponse.json({ message: 'Pembayaran iuran berhasil diperbarui', data: updated });
  } catch (err) {
    console.error('[POST /api/fee-payments]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
