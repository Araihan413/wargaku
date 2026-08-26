import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getFamilyById } from '@/db/queries/population/family.queries';
import { getUserById } from '@/db/queries/auth/user.queries';
import {
  getActiveChangeRequest,
  updateDraftChangeRequest,
  createOrGetDraftChangeRequest,
  cancelChangeRequest,
} from '@/db/queries/population/family-change-request.queries';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';
import { deleteNotificationsByRedirectLink } from '@/lib/notifications';
import { updateChangeRequestDraftSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';


/**
 * @openapi
 * /api/families/{id}/change-request:
 *   get:
 *     summary: Mengambil permohonan perubahan data keluarga yang sedang aktif
 *     description: Mengambil data draf perubahan Kartu Keluarga untuk keluarga tertentu berdasarkan ID KK. Dapat diakses oleh warga bersangkutan (Kepala Keluarga) atau pengurus RT.
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
 *         description: Berhasil mengambil data permohonan perubahan KK
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui isi draf permohonan perubahan data keluarga
 *     description: Mengubah data draf Kartu Keluarga (nomor KK, berkas KK, dan anggota keluarga) yang sedang aktif di database. Hanya dapat diakses oleh Kepala Keluarga saat status draf masih draft atau rejected.
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
 *         description: Draf perubahan KK berhasil disimpan
 *       400:
 *         description: Status draf tidak valid atau NIK duplikat
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Permohonan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Menginisialisasi draf permohonan perubahan data keluarga
 *     description: Membuat draf permohonan perubahan data baru berdasarkan snapshot data KK live saat ini jika belum ada. Hanya dapat diakses oleh Kepala Keluarga jika status KK saat ini sudah Terverifikasi.
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
 *         description: Draf perubahan data berhasil dibuka
 *       400:
 *         description: Permohonan perubahan sebelumnya sedang diproses atau status KK tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Hanya Kepala Keluarga yang berhak mengajukan
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Membatalkan pengajuan perubahan data keluarga
 *     description: Membatalkan permohonan perubahan KK yang sedang aktif (revert ke data KK live terverifikasi) dan menghapus draf berkas perubahan di Cloudinary. Hanya dapat diakses oleh Kepala Keluarga.
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
 *         description: Pengajuan perubahan KK berhasil dibatalkan dan dibersihkan
 *       400:
 *         description: Status permohonan tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Hanya Kepala Keluarga yang berhak membatalkan
 *       404:
 *         description: Permohonan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = Number(id);

    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isOfficer = await hasPermission(effectiveRoleId, 'manage-residents') || await hasPermission(effectiveRoleId, 'verify-documents');
    const isHeadOfFamily = family.headUserId === session.user.id;

    if (!isOfficer && !isHeadOfFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const activeRequest = await getActiveChangeRequest(familyId);

    return NextResponse.json({
      changeRequest: activeRequest,
      isDraftActive: activeRequest !== null && (activeRequest.status === 'draft' || activeRequest.status === 'pending' || activeRequest.status === 'rejected'),
    });
  } catch (error: any) {
    console.error('Error in GET /api/families/[id]/change-request:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = Number(id);

    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const currentUser = await getUserById(session.user.id);
    if (!currentUser || currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
        { status: 403 }
      );
    }

    const activeRequest = await getActiveChangeRequest(familyId);
    if (!activeRequest) {
      return NextResponse.json(
        { error: 'Tidak ada permohonan perubahan data yang sedang aktif' },
        { status: 404 }
      );
    }

    if (activeRequest.headUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    if (activeRequest.status !== 'draft' && activeRequest.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Draf sedang menunggu verifikasi RT dan tidak dapat diubah' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateChangeRequestDraftSchema.parse(body);

    await updateDraftChangeRequest(activeRequest.id, session.user.id, {
      familyNumber: validated.familyNumber || undefined,
      kkFile: validated.kkFile || undefined,
      members: validated.members as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Draf perubahan data KK berhasil disimpan.',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    if (error.message && error.message.startsWith('NIK_EXISTS:')) {
      const [_, nik, name] = error.message.split(':');
      return NextResponse.json(
        { error: `NIK ${nik} sudah terdaftar di sistem atas nama ${name}.` },
        { status: 400 }
      );
    }
    console.error('Error in PUT /api/families/[id]/change-request:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}


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

    const currentUser = await getUserById(session.user.id);
    if (!currentUser || currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
        { status: 403 }
      );
    }

    const changeRequest = await createOrGetDraftChangeRequest(familyId, session.user.id);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'REQUEST_FAMILY_CHANGE',
      module: 'kependudukan',
      description: `${session.user.name} membuka draf permohonan perubahan data Kartu Keluarga ID #${familyId}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Draf perubahan data berhasil dibuka. Anda dapat mengedit data anggota keluarga di bawah.',
      changeRequest,
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak mengajukan perubahan data' }, { status: 403 });
    }
    if (error.message === 'PENDING_EXISTS') {
      return NextResponse.json({ error: 'Permohonan perubahan data sebelumnya sedang dalam proses verifikasi RT' }, { status: 400 });
    }
    if (error.message === 'INVALID_FAMILY_STATUS') {
      return NextResponse.json({ error: 'Permohonan perubahan hanya dapat diajukan untuk Kartu Keluarga yang berstatus Terverifikasi' }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/change-request:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(
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

    const currentUser = await getUserById(session.user.id);
    if (!currentUser || currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
        { status: 403 }
      );
    }

    const activeReq = await getActiveChangeRequest(familyId);
    if (!activeReq) {
      return NextResponse.json({ error: 'Tidak ada permohonan perubahan data yang sedang aktif' }, { status: 404 });
    }

    await cancelChangeRequest(activeReq.id, session.user.id);

    await deleteNotificationsByRedirectLink(`/dashboard/approvals/documents/${familyId}?changeRequestId=${activeReq.id}`);

    return NextResponse.json({
      success: true,
      message: 'Permohonan perubahan data berhasil dibatalkan dan draf telah dibersihkan.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Hanya Kepala Keluarga yang berhak membatalkan perubahan KK' }, { status: 403 });
    }
    if (error.message === 'INVALID_STATUS') {
      return NextResponse.json({ error: 'Pembatalan perubahan hanya dapat dilakukan jika KK berstatus Draf atau Perubahan Tertunda' }, { status: 400 });
    }
    console.error('Error in DELETE /api/families/[id]/change-request:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
