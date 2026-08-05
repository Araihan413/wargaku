import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getPermissionsByRoleId } from '@/db/queries/system/permission.queries';
import { getUserRoles } from '@/db/queries/auth/user.queries';
import { getEffectiveRoleId } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRoleId = searchParams.get('roleId');

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowedRoles = await getUserRoles(session.user.id);
    let targetRoleId = effectiveRoleId;

    if (requestedRoleId && !isNaN(Number(requestedRoleId))) {
      const parsedRoleId = Number(requestedRoleId);
      
      const isAllowedRole = 
        effectiveRoleId === 1 || 
        allowedRoles.includes(parsedRoleId);

      if (!isAllowedRole) {
        return NextResponse.json(
          { error: 'Tidak memiliki izin untuk melihat permission role ini' },
          { status: 403 }
        );
      }
      targetRoleId = parsedRoleId;
    }

    const permissions = await getPermissionsByRoleId(targetRoleId);

    return NextResponse.json({
      roleId: targetRoleId,
      allowedRoles,
      permissions,
    });
  } catch (error: any) {
    console.error('Error in GET /api/permissions/my-permissions:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
