import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getDwellingDetailById } from '@/db/queries/kependudukan';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth and permission check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, 'view-residents');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const dwellingId = Number(id);

    if (isNaN(dwellingId)) {
      return NextResponse.json({ error: 'ID Hunian tidak valid' }, { status: 400 });
    }

    const detail = await getDwellingDetailById(dwellingId);

    if (!detail) {
      return NextResponse.json({ error: 'Hunian tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error: any) {
    console.error('Error in GET /api/dwellings/[id]/detail:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
