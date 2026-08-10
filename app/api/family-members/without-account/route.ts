import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { listFamilyMembersWithoutAccount } from '@/db/queries';

/**
 * @openapi
 * /api/family-members/without-account:
 *   get:
 *     summary: Mendapatkan daftar warga (anggota keluarga) yang belum memiliki akun pengguna
 *     description: Digunakan (biasanya oleh form claim warga atau admin) untuk memilih data warga yang ada di sistem namun belum terhubung dengan user akun manapun. Memerlukan izin view-residents.
 *     tags:
 *       - Kependudukan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar warga tanpa akun
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(_request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'view-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const members = await listFamilyMembersWithoutAccount();

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error in GET /api/family-members/without-account:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
