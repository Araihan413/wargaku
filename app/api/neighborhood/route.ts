import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getNeighborhoodMap } from '@/db/queries/kependudukan';

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    // 2. Check if officer (view-residents permission)
    const isOfficer = await hasPermission(session.user.roleId, 'view-residents');

    // 3. Fetch neighborhood map data
    const results = await getNeighborhoodMap(isOfficer);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in GET /api/neighborhood:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
