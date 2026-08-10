import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getPermissionsByRoleId } from '@/db/queries/system/permission.queries';
import { getUserRoles } from '@/db/queries/auth/user.queries';
import { getEffectiveRoleId } from '@/lib/rbac';

/**
 * @openapi
 * /api/permissions/my-permissions:
 *   get:
 *     summary: Mendapatkan hak akses (permissions) saya
 *     description: Mengambil daftar permission yang dimiliki oleh pengguna berdasarkan role aktifnya saat ini. Jika roleId disertakan, akan mengembalikan permission untuk role tersebut (asalkan pengguna memilikinya atau adalah Super Admin).
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: ID Role yang ingin dilihat permission-nya (opsional)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan permission
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin untuk melihat permission role tersebut
 *       500:
 *         description: Kesalahan server internal
 */
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
