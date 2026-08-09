import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { listFamilies, createFamilyWithHeadMember } from '@/db/queries';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    const verificationStatus = searchParams.get('verificationStatus') as 'draft' | 'pending' | 'verified' | 'rejected' || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listFamilies({
      limit,
      offset,
      query,
      verificationStatus,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/families:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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
    const familyId = await createFamilyWithHeadMember(body);

    return NextResponse.json({ id: familyId, message: 'Kartu Keluarga berhasil dibuat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/families:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
