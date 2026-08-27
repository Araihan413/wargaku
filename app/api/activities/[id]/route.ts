import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import {
  getActivityById,
  updateActivity,
  deleteActivity,
} from '@/db/queries/communication/activity.queries';
import { deleteNotificationsByRedirectLink, notifyAllWarga } from '@/lib/notifications';
import { updateActivitySchema } from '@/lib/validations/layanan';
import { ZodError } from 'zod';

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
 *     summary: Memperbarui kegiatan RT
 *     description: |
 *       Memperbarui data agenda kegiatan RT (judul, deskripsi, tanggal, lokasi, atau lampiran). 
 *       Secara otomatis mengirimkan notifikasi pembaruan ke seluruh warga jika terdapat perubahan 
 *       pada tanggal/jam, lokasi, atau judul kegiatan. Membutuhkan izin manage-activities.
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
 *         description: Kegiatan RT berhasil diperbarui
 *       400:
 *         description: Data tidak valid, tidak ada perubahan, atau kuota pin terlampaui
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
    const { session, errorResponse } = await validateApiAuth('manage-activities');
    if (errorResponse || !session) return errorResponse;

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
    const validated = updateActivitySchema.parse(body);

    await updateActivity(actId, {
      ...validated,
      attachments: validated.attachments || undefined,
    });

    // Cek bidang mana yang berubah (Waktu, Lokasi, atau Judul)
    const isDateChanged = validated.eventDate && new Date(validated.eventDate).getTime() !== new Date(existing.eventDate).getTime();
    const isLocationChanged = validated.location !== undefined && validated.location?.trim() !== existing.location;
    const isTitleChanged = validated.title !== undefined && validated.title?.trim() !== existing.title;


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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
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
    const { session, errorResponse } = await validateApiAuth('manage-activities');
    if (errorResponse || !session) return errorResponse;

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
