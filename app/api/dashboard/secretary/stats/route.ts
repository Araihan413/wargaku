import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId } from '@/lib/rbac';
import { getSecretaryDashboardStats } from '@/db/queries';

/**
 * @openapi
 * /api/dashboard/secretary/stats:
 *   get:
 *     summary: Mendapatkan statistik dashboard Sekretaris
 *     description: Mengambil data statistik untuk dashboard Sekretaris (misal total penduduk, keluarga, persetujuan tertunda). Dapat diakses oleh Admin, Ketua RT, dan Sekretaris (Role ID 1, 2, 3).
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan statistik sekretaris
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
    const isAllowed = [1, 2, 3].includes(effectiveRoleId);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const stats = await getSecretaryDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/secretary/stats:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
