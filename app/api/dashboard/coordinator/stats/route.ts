import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getCoordinatorDashboardStats } from '@/db/queries';

/**
 * @openapi
 * /api/dashboard/coordinator/stats:
 *   get:
 *     summary: Mendapatkan statistik dashboard Koordinator
 *     description: Mengambil data statistik untuk dashboard Koordinator (mengelola kost/kontrakan).
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan statistik koordinator
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed =
      effectiveRoleId === 5 ||
      await hasPermission(effectiveRoleId, 'manage-boarding');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const stats = await getCoordinatorDashboardStats(session.user.id, effectiveRoleId ?? undefined);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/coordinator/stats:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
