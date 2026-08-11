import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import {
  getActivityById,
  updateActivity,
  deleteActivity,
} from '@/db/queries/communication/activity.queries';
import { deleteNotificationsByRedirectLink, notifyAllWarga } from '@/lib/notifications';

/**
 * @openapi
 * /api/activities/{id}:
 *   get:
 *     summary: Mendapatkan detail kegiatan RT
 *     description: Mengambil data lengkap dari sebuah kegiatan atau agenda RT berdasarkan ID.
 *     tags:
 *       - Kegiatan & Agenda
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kegiatan RT
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail kegiatan
 *       400:
 *         description: ID kegiatan tidak valid
 *       404:
 *         description: Kegiatan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    const item = await getActivityById(actId);

    if (!item) {
      return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error in GET /api/activities/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/activities/{id}:
 *   patch:
 *     summary: Memperbarui data kegiatan RT
 *     description: |
 *       Mengubah data kegiatan RT (judul, deskripsi, tanggal, lokasi, lampiran, status disematkan).
 *       Hanya dapat diakses oleh pengguna dengan izin manage-activities.
 *     tags:
 *       - Kegiatan & Agenda
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kegiatan RT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               attachments:
 *                 type: string
 *               isPinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kegiatan berhasil diperbarui
 *       400:
 *         description: Data tidak valid, tidak ada perubahan, atau melampaui batas pin (maksimal 1)
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kegiatan RT tidak ditemukan
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-activities');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk mengedit kegiatan RT' }, { status: 403 });
    }

    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    const existing = await getActivityById(actId);
    if (!existing) {
      return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    await updateActivity(actId, body);

    // Cek bidang mana yang berubah (Waktu, Lokasi, atau Judul)
    const isDateChanged = body.eventDate && new Date(body.eventDate).getTime() !== new Date(existing.eventDate).getTime();
    const isLocationChanged = body.location !== undefined && body.location?.trim() !== existing.location;
    const isTitleChanged = body.title !== undefined && body.title?.trim() !== existing.title;

    if (isDateChanged || isLocationChanged || isTitleChanged) {
      const currentTitle = body.title ? body.title.trim() : existing.title;
      const changes: string[] = [];

      if (isDateChanged) {
        const formattedDate = new Date(body.eventDate).toLocaleString('id-ID', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
        changes.push(`Waktu: ${formattedDate}`);
      }

      if (isLocationChanged) {
        changes.push(`Lokasi: ${body.location?.trim() || 'Balai RT'}`);
      }

      let notifMessage = '';
      if (changes.length > 0) {
        notifMessage = `Detail kegiatan "${currentTitle}" telah diperbarui oleh Pengurus RT (${changes.join(', ')}).`;
      } else if (isTitleChanged) {
        notifMessage = `Judul kegiatan RT telah diperbarui menjadi "${currentTitle}".`;
      }

      if (notifMessage) {
        notifyAllWarga({
          title: 'Pembaruan Agenda Kegiatan',
          message: notifMessage,
          category: 'personal',
          redirectLink: '/dashboard/activities',
        }).catch((err) => console.error('Gagal mengirim notifikasi update kegiatan:', err));
      }
    }

    return NextResponse.json({ message: 'Kegiatan RT berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
      }
      if (error.message === "NO_CHANGES") {
        return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });
      }
      if (error.message === "PINNED_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: 'Maksimal 1 kegiatan RT yang dapat disematkan secara bersamaan' },
          { status: 400 }
        );
      }
    }
    console.error('Error in PATCH /api/activities/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/activities/{id}:
 *   delete:
 *     summary: Menghapus kegiatan RT
 *     description: |
 *       Menghapus agenda kegiatan RT dari database dan secara otomatis membersihkan notifikasi 
 *       terkait yang pernah dikirim ke warga. Membutuhkan izin manage-activities.
 *     tags:
 *       - Kegiatan & Agenda
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kegiatan RT
 *     responses:
 *       200:
 *         description: Kegiatan RT berhasil dihapus
 *       400:
 *         description: ID kegiatan tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kegiatan RT tidak ditemukan
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-activities');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin untuk menghapus kegiatan RT' }, { status: 403 });
    }


    const { id } = await params;
    const actId = parseInt(id, 10);

    if (isNaN(actId)) {
      return NextResponse.json({ error: 'ID kegiatan tidak valid' }, { status: 400 });
    }

    await deleteActivity(actId);

    // Hapus notifikasi terkait yang pernah dikirimkan ke warga
    deleteNotificationsByRedirectLink("/kegiatan").catch((err) =>
      console.error("Gagal menghapus notifikasi kegiatan:", err)
    );

    return NextResponse.json({ message: 'Kegiatan RT berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Kegiatan RT tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/activities/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
