import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getFamilyById, updateFamily, deleteFamily } from '@/db/queries/kependudukan';
import { updateFamilySchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary';

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
 *               unitNumber:
 *                 type: string
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

    const hasViewPerm = await hasPermission(session.user.roleId, 'view-residents');
    const isOwnFamily = family.headUserId === session.user.id;

    if (!hasViewPerm && !isOwnFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke keluarga ini' }, { status: 403 });
    }

    return NextResponse.json(family);
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

    const hasManagePerm = await hasPermission(session.user.roleId, 'manage-residents');
    const isOwnFamily = family.headUserId === session.user.id;

    if (!hasManagePerm && !isOwnFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    let updateData: any;

    if (!hasManagePerm) {
      // Perilaku Warga: cek aturan lock status verified
      if (family.verificationStatus === 'verified') {
        return NextResponse.json(
          { error: 'Data keluarga yang terverifikasi dikunci. Silakan ajukan perubahan data.' },
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

    // Hapus file KK lama dari Cloudinary jika diganti dengan file baru
    if (validated.kkFile && family.kkFile && validated.kkFile !== family.kkFile) {
      await deleteCloudinaryFileByUrl(family.kkFile);
    }

    await updateFamily(familyId, validated);

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

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, 'manage-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const family = await getFamilyById(familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    await deleteFamily(familyId);

    return NextResponse.json({ message: 'Kartu Keluarga berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/families/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
