import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { dismissBroadcast } from '@/db/queries/system/broadcast.queries';

/**
 * @openapi
 * /api/broadcasts/{id}/dismiss:
 *   post:
 *     summary: Menutup / Menyembunyikan broadcast sistem untuk pengguna login
 *     description: Mencatat bahwa pengguna yang sedang login telah menutup banner broadcast spesifik agar tidak muncul kembali di layarnya.
 *     tags:
 *       - Broadcast Sistem
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Broadcast berhasil di-dismiss
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const broadcastId = parseInt(id);

    if (isNaN(broadcastId)) {
      return NextResponse.json({ error: 'ID broadcast tidak valid' }, { status: 400 });
    }

    await dismissBroadcast(session.user.id, broadcastId);

    return NextResponse.json({ success: true, message: 'Broadcast berhasil ditutup' });
  } catch (error: any) {
    console.error('Error in POST /api/broadcasts/[id]/dismiss:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
