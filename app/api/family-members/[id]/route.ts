import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  getFamilyMemberById,
  updateFamilyMember,
  deleteFamilyMember,
} from '@/db/queries/population/family-member.queries';
import { updateWargaSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/family-members/{id}:
 *   get:
 *     summary: Mendapatkan detail anggota keluarga
 *     description: Mengambil data detail satu warga (anggota keluarga) berdasarkan ID. Memerlukan izin view-residents.
 *     tags:
 *       - Kependudukan
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
 *         description: Berhasil mendapatkan detail warga
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Anggota keluarga tidak ditemukan
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'view-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const member = await getFamilyMemberById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Anggota keluarga tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Error in GET /api/family-members/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

import { getFamilyById } from '@/db/queries/population/family.queries';

/**
 * @openapi
 * /api/family-members/{id}:
 *   put:
 *     summary: Memperbarui data anggota keluarga
 *     description: |
 *       Mengubah data warga.
 *       Jika Kartu Keluarga sedang dikunci (diverifikasi), warga hanya bisa mengubah data minor (pendidikan, pekerjaan, dll).
 *       Admin/RT dengan izin manage-residents bisa mengubah semua data.
 *     tags:
 *       - Kependudukan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nik:
 *                 type: string
 *               gender:
 *                 type: string
 *               relationship:
 *                 type: string
 *               birthPlace:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               phone:
 *                 type: string
 *               occupation:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *               religion:
 *                 type: string
 *               ktpFile:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               inactiveNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data berhasil diperbarui
 *       400:
 *         description: Validasi gagal atau ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Anggota keluarga tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(
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
    const isOfficer = await hasPermission(effectiveRoleId, 'manage-residents');

    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingMember = await getFamilyMemberById(memberId);
    if (!existingMember) {
      return NextResponse.json({ error: 'Anggota keluarga tidak ditemukan' }, { status: 404 });
    }

    const family = await getFamilyById(existingMember.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const isHeadOfFamily = family.headUserId === session.user.id;
    if (!isOfficer && !isHeadOfFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const allowedStatuses = ['draft', 'rejected', 'changes_pending'];
    const isLocked = !isOfficer && !allowedStatuses.includes(family.verificationStatus);

    const body = await request.json();
    const validatedData = updateWargaSchema.parse(body);

    let updatePayload: any = {
      birthPlace: validatedData.birthPlace,
      birthDate: validatedData.birthDate ? String(validatedData.birthDate) : undefined,
      phone: validatedData.phone,
      occupation: validatedData.occupation,
      educationLevel: validatedData.educationLevel,
      religion: validatedData.religion,
    };

    if (validatedData.isActive !== undefined) {
      updatePayload.isActive = validatedData.isActive;
    }
    if (validatedData.inactiveNote !== undefined) {
      updatePayload.inactiveNote = validatedData.inactiveNote;
    }

    if (!isLocked) {
      updatePayload = {
        ...updatePayload,
        name: validatedData.name,
        nik: validatedData.nik,
        gender: validatedData.gender,
        relationship: validatedData.relationship,
        ktpFile: validatedData.ktpFile,
      };
    }

    await updateFamilyMember(memberId, updatePayload);

    return NextResponse.json({ message: 'Data anggota keluarga berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/family-members/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/family-members/{id}:
 *   delete:
 *     summary: Menghapus (Nonaktifkan) anggota keluarga
 *     description: Mengubah status warga menjadi tidak aktif (isActive = false). Biasanya karena pindah, meninggal, dll.
 *     tags:
 *       - Kependudukan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inactiveNote:
 *                 type: string
 *                 description: Catatan penonaktifan (misal "Pindah Domisili")
 *     responses:
 *       200:
 *         description: Anggota keluarga berhasil dinonaktifkan
 *       400:
 *         description: ID tidak valid atau Kartu Keluarga sedang dikunci
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Anggota keluarga tidak ditemukan
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
    const isOfficer = await hasPermission(effectiveRoleId, 'manage-residents');

    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingMember = await getFamilyMemberById(memberId);
    if (!existingMember) {
      return NextResponse.json({ error: 'Anggota keluarga tidak ditemukan' }, { status: 404 });
    }

    const family = await getFamilyById(existingMember.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    const isHeadOfFamily = family.headUserId === session.user.id;
    if (!isOfficer && !isHeadOfFamily) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    if (!isOfficer) {
      const allowedStatuses = ['draft', 'rejected', 'changes_pending'];
      if (!allowedStatuses.includes(family.verificationStatus)) {
        return NextResponse.json(
          { error: 'Data Kartu Keluarga sedang dikunci untuk verifikasi RT. Silakan ajukan perubahan data terlebih dahulu.' },
          { status: 400 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    await deleteFamilyMember(memberId, body.inactiveNote);

    return NextResponse.json({ message: 'Anggota keluarga berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/family-members/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
