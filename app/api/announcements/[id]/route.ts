import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/db/queries/communication/announcement.queries';
import { deleteNotificationsByRedirectLink } from '@/lib/notifications';
import { updateAnnouncementSchema } from '@/lib/validations/layanan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/announcements/{id}:
 *   get:
 *     summary: Mendapatkan detail pengumuman
 *     description: Mengambil data lengkap pengumuman beserta lampirannya berdasarkan ID.
 *     tags:
 *       - Pengumuman & Informasi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengumuman
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pengumuman
 *       400:
 *         description: ID pengumuman tidak valid
 *       404:
 *         description: Pengumuman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    const item = await getAnnouncementById(annId);

    if (!item) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error in GET /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/announcements/{id}:
 *   patch:
 *     summary: Memperbarui pengumuman
 *     description: Memperbarui judul, isi, kategori, status disematkan, atau lampiran pengumuman. Maksimal 3 pengumuman yang dapat disematkan (pinned). Memerlukan hak akses manage-announcements.
 *     tags:
 *       - Pengumuman & Informasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengumuman
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [umum, penting, mendesak]
 *               isPinned:
 *                 type: boolean
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Pengumuman berhasil diperbarui
 *       400:
 *         description: Data tidak valid atau batas maksimal pinned (3) terlampaui
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Pengumuman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-announcements');
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    await updateAnnouncement(annId, validated);

    return NextResponse.json({ message: 'Pengumuman berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
      }
      if (error.message === "NO_CHANGES") {
        return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });
      }
      if (error.message === "PINNED_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: 'Maksimal 3 pengumuman yang dapat disematkan secara bersamaan' },
          { status: 400 }
        );
      }
    }
    console.error('Error in PATCH /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}


/**
 * @openapi
 * /api/announcements/{id}:
 *   delete:
 *     summary: Menghapus pengumuman
 *     description: |
 *       Menghapus pengumuman dari database dan secara otomatis membersihkan notifikasi terkait 
 *       yang pernah dikirimkan ke warga. Memerlukan hak akses manage-announcements.
 *     tags:
 *       - Pengumuman & Informasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengumuman
 *     responses:
 *       200:
 *         description: Pengumuman berhasil dihapus
 *       400:
 *         description: ID pengumuman tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Pengumuman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-announcements');
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    await deleteAnnouncement(annId);

    // Hapus notifikasi terkait yang pernah dikirimkan ke warga
    deleteNotificationsByRedirectLink("/pengumuman").catch((err) =>
      console.error("Gagal menghapus notifikasi pengumuman:", err)
    );

    return NextResponse.json({ message: 'Pengumuman berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/announcements/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
