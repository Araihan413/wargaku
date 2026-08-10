import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cancelSubmitFamily } from '@/db/queries/population/family.queries';

/**
 * @openapi
 * /api/families/{id}/cancel-submit:
 *   post:
 *     summary: Membatalkan pengajuan verifikasi Kartu Keluarga (Kembali ke Draf)
 *     description: Membatalkan pengajuan KK yang sedang berstatus "pending" (menunggu verifikasi RT) dan mengembalikannya ke status "draft". Hanya Kepala Keluarga yang dapat membatalkan pengajuan ini.
 *     tags:
 *       - Kepala Keluarga
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kartu Keluarga
 *     responses:
 *       200:
 *         description: Pengajuan verifikasi Kartu Keluarga berhasil dibatalkan
 *       400:
 *         description: Invalid status (bukan pending) atau ID KK tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Hanya Kepala Keluarga yang berhak membatalkan
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = Number(id);

    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID Kartu Keluarga tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    await cancelSubmitFamily(familyId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Pengajuan verifikasi Kartu Keluarga berhasil dibatalkan dan dikembalikan ke Draf.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan pengajuan berkas KK' }, { status: 403 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Pengajuan tidak dapat dibatalkan karena tidak berstatus pending' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/cancel-submit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
