import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getCoordinatorStats } from '@/db/queries/dashboard';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const isAllowed =
      session.user.roleId === 5 ||
      await hasPermission(session.user.roleId, 'manage-boarding');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const stats = await getCoordinatorStats(session.user.id, session.user.roleId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/coordinator/stats:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
