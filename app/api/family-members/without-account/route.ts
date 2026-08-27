import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
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
    const { session, errorResponse } = await validateApiAuth('view-residents');
    if (errorResponse || !session) return errorResponse;

    const members = await listFamilyMembersWithoutAccount();

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error in GET /api/family-members/without-account:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
