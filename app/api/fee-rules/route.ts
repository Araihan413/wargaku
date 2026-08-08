import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listFeeRules, createFeeRule } from '@/db/queries/finance/fee.queries';
import { notifyAllWarga, notifyRoles } from '@/lib/notifications';
import { z } from 'zod';

const createFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = (await hasPermission(effectiveRoleId, 'manage-iuran')) || (await hasPermission(effectiveRoleId, 'view-arrears'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const data = await listFeeRules();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/fee-rules]', err);
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
      return NextResponse.json({ error: 'Tidak memiliki izin untuk membuat aturan iuran' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', issues: parsed.error.issues }, { status: 400 });
    }

    const { id, period } = await createFeeRule(parsed.data, session.user.id);

    notifyAllWarga({
      title: 'Tagihan Iuran RT Baru',
      message: `Tagihan '${parsed.data.name}' periode ${period} sebesar Rp ${Number(parsed.data.amount).toLocaleString('id-ID')} telah diterbitkan.`,
      category: 'personal',
      redirectLink: '/dashboard/finance',
    }).catch((notifErr: any) => console.error('Gagal broadcast notifikasi iuran baru:', notifErr));

    notifyRoles(['4'], {
      title: 'Daftar Tagihan Iuran Berhasil Dibuat',
      message: `Aturan '${parsed.data.name}' berhasil dibuat oleh pengurus. Siap menerima catatan pembayaran warga.`,
      category: 'dinas',
      redirectLink: '/dashboard/finance',
    }).catch((notifErr: any) => console.error('Gagal notifyRole bendahara:', notifErr));

    return NextResponse.json({ message: 'Aturan iuran berhasil dibuat & tagihan periode diterbitkan', data: { id, period } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/fee-rules]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
