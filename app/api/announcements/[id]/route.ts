import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/db/queries/communication/announcement.queries';
import { deleteNotificationsByRedirectLink } from '@/lib/notifications';

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
 *     description: |
 *       Memperbarui data pengumuman (judul, isi, lampiran, kategori, atau status pinned). 
 *       Hanya dapat dilakukan oleh pengguna dengan hak akses manage-announcements.
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
 *               attachments:
 *                 type: string
 *               isPinned:
 *                 type: boolean
 *               pinUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Pengumuman berhasil diperbarui
 *       400:
 *         description: ID tidak valid, tidak ada perubahan data, atau batas pin terlampaui
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-announcements');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengedit pengumuman' }, { status: 403 });
    }


    const { id } = await params;
    const annId = parseInt(id, 10);

    if (isNaN(annId)) {
      return NextResponse.json({ error: 'ID pengumuman tidak valid' }, { status: 400 });
    }

    const body = await request.json();

    await updateAnnouncement(annId, body);

    return NextResponse.json({ message: 'Pengumuman berhasil diperbarui' });
  } catch (error: any) {
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-announcements');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk menghapus pengumuman' }, { status: 403 });
    }


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
