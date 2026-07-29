import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface RoleData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface PermissionData {
  id: number;
  slug: string;
  name: string;
  module: string;
  description: string | null;
}

export interface RolePermissionMatrix {
  roles: RoleData[];
  permissions: PermissionData[];
  moduleGroups: {
    module: string;
    permissions: PermissionData[];
  }[];
  // Map<roleId, Set<permissionId>>
  matrix: Record<number, number[]>;
}

/**
 * Mengambil data lengkap matriks Role & Permission untuk antarmuka Super Admin
 */
export async function getRolePermissionMatrix(): Promise<RolePermissionMatrix> {
  const roles = await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
    })
    .from(schema.roles)
    .orderBy(schema.roles.id);

  const permissions = await db
    .select({
      id: schema.permissions.id,
      slug: schema.permissions.slug,
      name: schema.permissions.name,
      module: schema.permissions.module,
      description: schema.permissions.description,
    })
    .from(schema.permissions)
    .orderBy(schema.permissions.module, schema.permissions.id);

  const allRolePermissions = await db
    .select({
      roleId: schema.rolePermissions.roleId,
      permissionId: schema.rolePermissions.permissionId,
    })
    .from(schema.rolePermissions);

  // Group permissions per module
  const moduleMap: Record<string, PermissionData[]> = {};
  permissions.forEach((p) => {
    if (!moduleMap[p.module]) {
      moduleMap[p.module] = [];
    }
    moduleMap[p.module].push(p);
  });

  const moduleGroups = Object.keys(moduleMap).map((module) => ({
    module,
    permissions: moduleMap[module],
  }));

  // Build matrix dictionary
  const matrix: Record<number, number[]> = {};
  roles.forEach((r) => {
    matrix[r.id] = [];
  });

  allRolePermissions.forEach((rp) => {
    if (matrix[rp.roleId]) {
      matrix[rp.roleId].push(rp.permissionId);
    }
  });

  return {
    roles,
    permissions,
    moduleGroups,
    matrix,
  };
}

/**
 * Memperbarui hak akses permission untuk role tertentu secara aman
 */
export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
  actorUserId: string
) {
  // Guard proteksi khusus Super Admin (Role 1): Core system permissions tidak boleh dicabut
  if (roleId === 1) {
    const corePermissions = await db
      .select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(
        inArray(schema.permissions.slug, [
          "manage-users",
          "manage-roles",
          "view-audit-logs",
        ])
      );

    const coreIds = corePermissions.map((p) => p.id);
    // Pastikan coreIds tetap ada di list
    coreIds.forEach((cId) => {
      if (!permissionIds.includes(cId)) {
        permissionIds.push(cId);
      }
    });
  }

  // 1. Hapus permission lama untuk roleId ini
  await db
    .delete(schema.rolePermissions)
    .where(eq(schema.rolePermissions.roleId, roleId));

  // 2. Insert permission baru
  if (permissionIds.length > 0) {
    const newRecords = permissionIds.map((pId) => ({
      roleId,
      permissionId: pId,
    }));
    await db.insert(schema.rolePermissions).values(newRecords);
  }

  // 3. Catat log aktivitas audit
  const [targetRole] = await db
    .select({ name: schema.roles.name })
    .from(schema.roles)
    .where(eq(schema.roles.id, roleId));

  await db.insert(schema.activityLogs).values({
    userId: actorUserId,
    action: "UPDATE_PERMISSIONS",
    module: "pengguna",
    description: `Memperbarui matriks permission untuk role: ${targetRole?.name || `Role #${roleId}`} (${permissionIds.length} izin diaktifkan)`,
  });

  return { success: true, count: permissionIds.length };
}
