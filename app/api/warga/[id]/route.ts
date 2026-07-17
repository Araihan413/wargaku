import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getFamilyMemberById, updateFamilyMember, deleteFamilyMember, getFamilyById } from '@/db/queries/kependudukan';
import { updateWargaSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/warga/{id}:
 *   get:
 *     summary: Mengambil detail satu warga (Pengurus & Pemilik KK)
 *     tags: [Warga]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Warga
 *     responses:
 *       200:
 *         description: Detail warga berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Warga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui data warga (Pengurus & Pemilik KK)
 *     tags: [Warga]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Warga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               occupation:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *               birthPlace:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [L, P]
 *               relationship:
 *                 type: string
 *                 enum: [Kepala_Keluarga, Istri, Anak, Orang_Tua, Lainnya]
 *     responses:
 *       200:
 *         description: Data warga berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Terkunci (status verified) atau tidak memiliki izin akses
 *       404:
 *         description: Warga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menonaktifkan warga / Soft Delete (Pengurus & Pemilik KK)
 *     tags: [Warga]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Warga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inactiveReason
 *             properties:
 *               inactiveReason:
 *                 type: string
 *                 enum: [pindah, meninggal]
 *     responses:
 *       200:
 *         description: Warga berhasil dinonaktifkan
 *       400:
 *         description: Alasan penonaktifan tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Terkunci (status verified) atau tidak memiliki izin akses
 *       404:
 *         description: Warga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const member = await getFamilyMemberById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    const hasViewPerm = await hasPermission(session.user.roleId, 'view-residents');
    const hasOwnFamilyPerm = await hasPermission(session.user.roleId, 'manage-own-family');

    if (hasViewPerm) {
      return NextResponse.json(member);
    }

    if (hasOwnFamilyPerm) {
      const family = await getFamilyById(member.familyId);
      if (family && family.headUserId === session.user.id) {
        return NextResponse.json(member);
      }
    }

    return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
  } catch (error: any) {
    console.error('Error in GET /api/warga/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const member = await getFamilyMemberById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    const family = await getFamilyById(member.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan untuk warga ini' }, { status: 444 });
    }

    const hasManagePerm = await hasPermission(session.user.roleId, 'manage-residents');
    const isOwnFamily = family.headUserId === session.user.id;
    const hasOwnFamilyPerm = await hasPermission(session.user.roleId, 'manage-own-family');

    if (!hasManagePerm && !(hasOwnFamilyPerm && isOwnFamily)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    let updateData: any;

    if (!hasManagePerm) {
      // Perilaku Warga: cek aturan lock status verified
      if (family.verificationStatus === 'verified') {
        return NextResponse.json(
          { error: 'Keluarga telah terverifikasi. Data anggota keluarga dikunci. Silakan ajukan perubahan data.' },
          { status: 403 }
        );
      }
      // Warga dilarang mengubah status keaktifan warga secara langsung di sini
      const safeBody = { ...body };
      delete safeBody.isActive;
      delete safeBody.inactiveReason;
      updateData = safeBody;
    } else {
      updateData = body;
    }

    const validated = updateWargaSchema.parse(updateData);
    await updateFamilyMember(memberId, validated);

    return NextResponse.json({ message: 'Data warga berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/warga/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const member = await getFamilyMemberById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    const family = await getFamilyById(member.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan untuk warga ini' }, { status: 444 });
    }

    const hasManagePerm = await hasPermission(session.user.roleId, 'manage-residents');
    const isOwnFamily = family.headUserId === session.user.id;
    const hasOwnFamilyPerm = await hasPermission(session.user.roleId, 'manage-own-family');

    if (!hasManagePerm && !(hasOwnFamilyPerm && isOwnFamily)) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    // Aturan Lock untuk Warga
    if (!hasManagePerm) {
      if (family.verificationStatus === 'verified') {
        return NextResponse.json(
          { error: 'Keluarga telah terverifikasi. Tidak dapat menghapus anggota keluarga.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const inactiveReason = body?.inactiveReason;

    if (inactiveReason !== 'pindah' && inactiveReason !== 'meninggal') {
      return NextResponse.json({ error: 'Alasan penonaktifan tidak valid (pindah / meninggal)' }, { status: 400 });
    }

    await deleteFamilyMember(memberId, inactiveReason);

    return NextResponse.json({ message: 'Warga berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/warga/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
