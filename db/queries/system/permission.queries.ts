import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createAuditLog } from './audit-log.queries';

export async function listPermissions() {
  return db.select().from(schema.permissions);
}

export async function createPermission(data: { name: string; slug: string; module: string; description?: string }) {
  const [res] = await db.insert(schema.permissions).values(data);
  return res;
}

export async function getRolePermissionMatrix() {
  const [allRoles, allPermissions, allRolePerms] = await Promise.all([
    db.select().from(schema.roles).orderBy(schema.roles.id),
    db.select().from(schema.permissions).orderBy(schema.permissions.id),
    db.select().from(schema.rolePermissions),
  ]);

  const matrix: Record<number, number[]> = {};
  allRoles.forEach((role) => {
    matrix[role.id] = [];
  });

  allRolePerms.forEach((rp) => {
    if (matrix[rp.roleId]) {
      matrix[rp.roleId].push(rp.permissionId);
    }
  });

  const groupsMap = new Map<string, typeof allPermissions>();
  allPermissions.forEach((perm) => {
    const list = groupsMap.get(perm.module) || [];
    list.push(perm);
    groupsMap.set(perm.module, list);
  });

  const moduleGroups = Array.from(groupsMap.entries()).map(([module, perms]) => ({
    module,
    permissions: perms,
  }));

  return {
    roles: allRoles,
    permissions: allPermissions,
    moduleGroups,
    matrix,
  };
}

export async function updateRolePermissions(roleId: number, permissionIds: number[], executorUserId?: string) {
  await db.transaction(async (tx) => {
    await tx.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await tx.insert(schema.rolePermissions).values(
        permissionIds.map((pId) => ({
          roleId,
          permissionId: pId,
        }))
      );
    }
  });

  if (executorUserId) {
    await createAuditLog({
      userId: executorUserId,
      action: 'UPDATE_ROLE_PERMISSIONS',
      module: 'RBAC',
      description: `Memperbarui hak akses untuk Role ID ${roleId}`,
    });
  }

  return true;
}

export async function getPermissionsByRoleId(roleId: number) {
  return db
    .select({
      id: schema.permissions.id,
      name: schema.permissions.name,
      slug: schema.permissions.slug,
      module: schema.permissions.module,
      description: schema.permissions.description,
    })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.rolePermissions.roleId, roleId));
}
