import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import { listUnpaidByFamily } from '@/db/queries/finance/fee.queries';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = (await hasPermission(effectiveRoleId, 'view-tunggakan')) || (await hasPermission(effectiveRoleId, 'manage-iuran'));
    if (!allowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleIdStr = searchParams.get('ruleId');
    const ruleId = ruleIdStr ? parseInt(ruleIdStr, 10) : null;

    const result = await listUnpaidByFamily(ruleId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/fee-payments/tunggakan]', err);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
