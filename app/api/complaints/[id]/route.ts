import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission, getEffectiveRoleId } from '@/lib/rbac';
import {
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
} from '@/db/queries/communication/complaint.queries';

/**
 * @openapi
 * /api/complaints/{id}:
 *   get:
 *     summary: Mendapatkan detail pengaduan
 *     description: Mengambil data detail pelaporan warga beserta lampirannya (berdasarkan ID internal). Butuh izin kelola (Ketua RT/Sekretaris atau manage-complaints).
 *     tags:
 *       - Pengaduan & Aspirasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengaduan
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail pengaduan
 *       400:
 *         description: ID pengaduan tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Data pengaduan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
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

    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    const complaint = await getComplaintById(complaintId);

    if (!complaint) {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: complaint });
  } catch (error: any) {
    console.error('Error in GET /api/complaints/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/complaints/{id}:
 *   patch:
 *     summary: Memperbarui status pengaduan warga
 *     description: |
 *       Memperbarui status laporan (menunggu, proses, selesai, ditolak) dan memberikan 
 *       catatan respons dari pengurus RT. Hanya pengguna dengan izin kelola pengaduan yang dapat mengubah ini.
 *     tags:
 *       - Pengaduan & Aspirasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengaduan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [menunggu, proses, selesai, ditolak]
 *               responseNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status pengaduan berhasil diperbarui
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Data pengaduan tidak ditemukan
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-complaints');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }


    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { status, responseNote } = body;

    await updateComplaintStatus(complaintId, { status, responseNote }, session.user.id);

    return NextResponse.json({ message: 'Status pengaduan berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in PATCH /api/complaints/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/complaints/{id}:
 *   delete:
 *     summary: Menghapus laporan pengaduan
 *     description: Menghapus laporan warga dari sistem secara permanen. Hanya pengguna dengan izin manage-complaints yang dapat mengakses ini.
 *     tags:
 *       - Pengaduan & Aspirasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengaduan
 *     responses:
 *       200:
 *         description: Pengaduan berhasil dihapus
 *       400:
 *         description: ID pengaduan tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Data pengaduan tidak ditemukan
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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-complaints');

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus pengaduan' },
        { status: 403 }
      );
    }


    const { id } = await params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return NextResponse.json({ error: 'ID pengaduan tidak valid' }, { status: 400 });
    }

    await deleteComplaint(complaintId);

    return NextResponse.json({ message: 'Pengaduan berhasil dihapus' });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in DELETE /api/complaints/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
