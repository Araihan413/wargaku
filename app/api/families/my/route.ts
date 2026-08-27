import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { getMyFamily } from '@/db/queries/population/family.queries';

/**
 * @openapi
 * /api/families/my:
 *   get:
 *     summary: Mendapatkan data Kartu Keluarga milik user saat ini
 *     description: Mengambil data ringkasan Kartu Keluarga di mana user yang sedang login terdaftar (baik sebagai Kepala Keluarga maupun anggota).
 *     tags:
 *       - Kepala Keluarga
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data keluarga user
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Kartu Keluarga Anda belum terdaftar di sistem
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const family = await getMyFamily(session.user.id);

    if (!family) {
      return NextResponse.json(
        { error: 'Kartu Keluarga Anda belum terdaftar di sistem. Silakan hubungi Ketua RT.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: family.id,
      familyNumber: family.familyNumber,
      headUserId: family.headUserId,
      headName: family.headName,
      isHeadOfFamily: family.headUserId === session.user.id,
      verificationStatus: family.verificationStatus,
      verificationNote: family.verificationNote,
      kkFile: family.kkFile,
      dwellingId: family.dwellingId,
    });

  } catch (error: any) {
    console.error('Error in GET /api/families/my:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
