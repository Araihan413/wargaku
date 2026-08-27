import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { changeFamilyHead } from '@/db/queries/population/family-member.queries';
import { changeFamilyHeadSchema } from '@/lib/validations/kependudukan';
import { ZodError } from 'zod';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

export async function POST(
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

    const body = await request.json();
    const validated = changeFamilyHeadSchema.parse(body);

    await changeFamilyHead({
      familyId,
      ...validated,
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'CHANGE_FAMILY_HEAD',
      module: 'kependudukan',
      description: `Mengganti Kepala Keluarga pada KK ID #${familyId} (anggota baru ID: ${validated.newHeadMemberId}).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      message: 'Kepala Keluarga berhasil diubah',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/families/[id]/change-head:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
