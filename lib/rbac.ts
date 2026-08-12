import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUserRoles } from '@/db/queries/auth/user.queries';

/**
 * Mengambil roleId efektif pengguna dengan memperhitungkan mode active_role_id (Role Switcher).
 * Memastikan bahwa pengguna hanya dapat beralih ke role yang secara resmi terdaftar di user_roles.
 * @param session Sesi pengguna dari Better Auth
 */
export async function getEffectiveRoleId(session: any): Promise<number | null> {
  if (!session?.user?.id) return null;

  const userAllowedRoles = await getUserRoles(session.user.id);
  if (userAllowedRoles.length === 0) return null;

  const primaryRoleId = userAllowedRoles[0] || null;

  try {
    const reqCookies = await cookies();
    const activeRoleCookie = reqCookies.get('active_role_id')?.value;
    if (activeRoleCookie) {
      const activeRoleId = parseInt(activeRoleCookie, 10);
      if (!isNaN(activeRoleId) && userAllowedRoles.includes(activeRoleId)) {
        return activeRoleId;
      }
    }
  } catch {
    // Abaikan jika dipanggil di luar konteks request HTTP
  }

  return primaryRoleId;
}

/**
 * Memeriksa apakah role tertentu memiliki permission slug tertentu.
 * @param roleId ID role pengguna (dari sesi Better Auth)
 * @param permissionSlug Slug dari permission yang ingin dicek (misal: 'view-residents')
 */
export async function hasPermission(roleId: number | null | undefined, permissionSlug: string): Promise<boolean> {
  if (!roleId) return false;

  const permissionCheck = await db
    .select({ id: schema.rolePermissions.id })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.rolePermissions.roleId, roleId),
        eq(schema.permissions.slug, permissionSlug)
      )
    )
    .limit(1);

  return permissionCheck.length > 0;
}

/**
 * Melakukan proteksi di sisi server (Server Component, Server Action, atau API Route).
 * Mengambil sesi aktif Better Auth, memverifikasi perannya, dan memastikan memiliki izin.
 * Jika tidak login atau tidak berhak, otomatis mengalihkan (redirect).
 * @param permissionSlug Slug dari permission yang dibutuhkan
 */
export async function requirePermission(permissionSlug: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const roleId = await getEffectiveRoleId(session);

  if (typeof roleId !== 'number') {
    redirect('/unauthorized');
  }

  const allowed = await hasPermission(roleId, permissionSlug);
  if (!allowed) {
    redirect('/unauthorized');
  }

  return session;
}
