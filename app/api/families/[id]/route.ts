import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { getFamilyById, updateFamily, deleteFamily } from '@/db/queries/population/family.queries';
import { getActiveChangeRequest, getChangeRequestById } from '@/db/queries/population/family-change-request.queries';
import { getUserById } from '@/db/queries/auth/user.queries';
import { updateFamilySchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary';
import { notifyUser } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';


/**
 * @openapi
 * /api/families/{id}:
 *   get:
 *     summary: Mendapatkan detail lengkap Kartu Keluarga (Pengurus & Pemilik KK)
 *     tags: [Kartu Keluarga]
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
 *         description: Detail Kartu Keluarga berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke keluarga ini
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui data Kartu Keluarga (Pengurus & Pemilik KK)
 *     tags: [Kartu Keluarga]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kartu Keluarga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kkFile:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               verificationStatus:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *               verificationNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data Kartu Keluarga berhasil diperbarui
 *       400:
 *         description: Validasi input gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Terkunci (status verified) atau tidak memiliki izin akses
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menonaktifkan Kartu Keluarga / Soft Delete (Khusus Pengurus)
 *     tags: [Kartu Keluarga]
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
 *         description: Kartu Keluarga berhasil dinonaktifkan
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (manage-residents)
 *       404:
 *         description: Kartu Keluarga tidak ditemukan
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

    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const hasViewPerm = await hasPermission(roleId, 'view-residents');
    const isOwnFamily = family.headUserId === session.user.id;

    if (!hasViewPerm && !isOwnFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke keluarga ini' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const changeRequestIdParam = searchParams.get('changeRequestId');

    let changeRequest = null;
    if (changeRequestIdParam && !isNaN(Number(changeRequestIdParam))) {
      changeRequest = await getChangeRequestById(Number(changeRequestIdParam));
    } else {
      changeRequest = await getActiveChangeRequest(familyId);
    }

    return NextResponse.json({
      ...family,
      changeRequest,
    });
  } catch (error: any) {
    console.error('Error in GET /api/families/[id]:', error);
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

    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const hasManagePerm = await hasPermission(roleId, 'manage-residents');
    const isOwnFamily = family.headUserId === session.user.id;

    if (!hasManagePerm && !isOwnFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }


    const body = await request.json();
    let updateData: any;

    if (!hasManagePerm) {
      // Periksa status akun pengguna
      const currentUser = await getUserById(session.user.id);
      if (!currentUser || currentUser.status !== 'active') {
        return NextResponse.json(
          { error: 'Akun Anda belum aktif atau sedang ditangguhkan' },
          { status: 403 }
        );
      }

      // Perilaku Warga: cek aturan lock status verified dan pending
      if (family.verificationStatus === 'verified' || family.verificationStatus === 'pending') {
        return NextResponse.json(
          { error: 'Data Kartu Keluarga yang terverifikasi atau sedang dalam proses peninjauan RT tidak dapat diubah secara langsung.' },
          { status: 403 }
        );
      }
      // Warga dilarang mengubah status verifikasi dan data kepala keluarga
      const safeBody = { ...body };
      delete safeBody.verificationStatus;
      delete safeBody.verificationNote;
      delete safeBody.headUserId;
      delete safeBody.headName;
      delete safeBody.isActive;
      updateData = safeBody;
    } else {
      // Perilaku RT/Admin
      updateData = body;
    }

    const validated = updateFamilySchema.parse(updateData);

    const oldKkFile = (validated.kkFile && family.kkFile && validated.kkFile !== family.kkFile) ? family.kkFile : null;

    await updateFamily(familyId, validated);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_FAMILY',
      module: 'kependudukan',
      description: `Memperbarui data Kartu Keluarga ID #${familyId}${hasManagePerm ? ' (oleh pengurus)' : ' (oleh kepala keluarga)'}.`,
      ipAddress,
    }).catch(() => null);

    // Kirim notifikasi ke Kepala Keluarga jika data diubah oleh Pengurus/RT
    if (hasManagePerm && family.headUserId && session.user.id !== family.headUserId) {
      notifyUser(family.headUserId, {
        title: "Pembaruan Data Keluarga",
        message: "Data Kartu Keluarga Anda telah diperbarui oleh Pengurus RT. Silakan tinjau.",
        category: "personal",
        redirectLink: "/dashboard/family",
      }).catch((notifErr) =>
        console.error("Gagal mengirim notifikasi update KK ke Kepala Keluarga:", notifErr)
      );
    }

    // Hapus file KK lama dari Cloudinary HANYA SETELAH update DB berhasil
    if (oldKkFile) {
      deleteCloudinaryFileByUrl(oldKkFile).catch((err) =>
        console.error('Gagal menghapus file KK lama dari Cloudinary:', err)
      );
    }

    return NextResponse.json({ message: 'Data Kartu Keluarga berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/families/[id]:', error);
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
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { session, errorResponse } = await validateApiAuth('manage-residents');
    if (errorResponse || !session) return errorResponse;


    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    await deleteFamily(familyId);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'DELETE_FAMILY',
      module: 'kependudukan',
      description: `Menonaktifkan Kartu Keluarga ID #${familyId} (No. KK: ${family.familyNumber || '-'}).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Kartu Keluarga berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/families/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
