import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Memeriksa apakah role tertentu memiliki permission slug tertentu.
 * @param roleId ID role pengguna (dari sesi Better Auth)
 * @param permissionSlug Slug dari permission yang ingin dicek (misal: 'view-residents')
 */
export async function hasPermission(roleId: number, permissionSlug: string): Promise<boolean> {
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

  // Mengambil roleId dari data user tambahan di sesi Better Auth
  const roleId = session.user.roleId;

  if (typeof roleId !== 'number') {
    redirect('/unauthorized');
  }

  const allowed = await hasPermission(roleId, permissionSlug);
  if (!allowed) {
    redirect('/unauthorized');
  }

  return session;
}
