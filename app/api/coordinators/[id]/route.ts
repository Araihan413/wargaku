import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { suspendCoordinator } from '@/db/queries/auth/user.queries';

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
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const resolvedParams = await params;
    const coordinatorId = resolvedParams.id;

    if (!coordinatorId) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const reallocatedCount = await suspendCoordinator(coordinatorId);

    return NextResponse.json({
      success: true,
      message: `Akun koordinator dinonaktifkan. Pengelolaan ${reallocatedCount} properti dialihkan kembali ke pemilik hunian.`,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/coordinators/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
