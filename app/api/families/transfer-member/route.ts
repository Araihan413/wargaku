import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getFamilyById } from '@/db/queries/population/family.queries';
import { getFamilyMemberById, transferFamilyMember } from '@/db/queries/population/family-member.queries';
import { transferFamilyMemberSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { notifyUser } from '@/lib/notifications';

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

    const newFamilyId = await transferFamilyMember({
      memberId: validated.memberId,
      targetFamilyId: validated.targetFamilyId || 0,
      relationship: validated.relationship,
    });

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
