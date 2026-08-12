import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getFamilyById, createFamily, deleteFamily } from '@/db/queries/population/family.queries';
import { getFamilyMemberById, transferFamilyMember, getFamilyMembersByFamilyId } from '@/db/queries/population/family-member.queries';
import { transferFamilyMemberSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { notifyUser } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const validated = transferFamilyMemberSchema.parse(body);

    const member = await getFamilyMemberById(validated.memberId).catch(() => null);
    const sourceFamilyId = member?.familyId;
    const sourceFamily = sourceFamilyId ? await getFamilyById(sourceFamilyId).catch(() => null) : null;

    if (member?.relationship === 'Kepala_Keluarga') {
      // Periksa apakah masih ada anggota aktif lain di KK ini
      const allMembers = await getFamilyMembersByFamilyId(sourceFamilyId!);
      const otherActiveMembers = allMembers.filter(m => m.isActive && m.id !== member.id);
      
      if (otherActiveMembers.length > 0) {
        return NextResponse.json(
          { error: 'Kepala Keluarga tidak bisa pindah KK karena masih ada anggota aktif lain. Lakukan Ganti Kepala Keluarga terlebih dahulu.' },
          { status: 400 }
        );
      }
    }

    let finalTargetFamilyId = validated.targetFamilyId;

    // Logika Pecah KK (Buat KK Baru)
    if (validated.createNewFamily) {
      if (!validated.familyNumber || !validated.dwellingId) {
        return NextResponse.json({ error: 'Nomor KK dan Alamat Hunian wajib diisi untuk membuat KK baru' }, { status: 400 });
      }

      finalTargetFamilyId = await createFamily({
        familyNumber: validated.familyNumber,
        dwellingId: validated.dwellingId,
        headUserId: member?.userId || null,
        verificationStatus: 'verified', // Karena dibuat oleh admin/pengurus
      });
    }

    if (!finalTargetFamilyId) {
      return NextResponse.json({ error: 'KK Tujuan tidak valid' }, { status: 400 });
    }

    const newFamilyId = await transferFamilyMember({
      memberId: validated.memberId,
      targetFamilyId: finalTargetFamilyId,
      relationship: validated.relationship,
    });

    // Otomatis nonaktifkan KK lama jika sekarang menjadi kosong
    if (sourceFamilyId) {
      const remainingMembers = await getFamilyMembersByFamilyId(sourceFamilyId);
      const activeRemaining = remainingMembers.filter(m => m.isActive);
      if (activeRemaining.length === 0) {
        await deleteFamily(sourceFamilyId);
      }
    }

    if (sourceFamily?.headUserId) {
      notifyUser(sourceFamily.headUserId, {
        title: "Anggota Keluarga Dipindahkan",
        message: `Seorang anggota keluarga Anda (${member?.name || 'Anggota'}) telah dipindahkan ke Kartu Keluarga lain oleh Pengurus RT.`,
        category: "personal",
        redirectLink: "/dashboard/family",
      });
    }

    const targetFamily = await getFamilyById(newFamilyId).catch(() => null);
    if (targetFamily?.headUserId && targetFamily.headUserId !== sourceFamily?.headUserId) {
      notifyUser(targetFamily.headUserId, {
        title: "Anggota Keluarga Baru Bergabung",
        message: `${member?.name || 'Seorang anggota'} telah bergabung ke Kartu Keluarga Anda dari KK lain atas penugasan Pengurus RT.`,
        category: "personal",
        redirectLink: "/dashboard/family",
      });
    }

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'TRANSFER_FAMILY_MEMBER',
      module: 'kependudukan',
      description: `Memindahkan anggota keluarga ${member?.name || `ID #${validated.memberId}`} ke KK ID #${newFamilyId}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      message: 'Anggota keluarga berhasil dipindahkan',
      familyId: newFamilyId,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/families/transfer-member:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
