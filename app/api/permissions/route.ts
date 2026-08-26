import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission, getEffectiveRoleId } from "@/lib/rbac";
import { getRolePermissionMatrix, updateRolePermissions } from '@/db/queries/system/permission.queries';
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";

/**
 * @openapi
 * /api/permissions:
 *   get:
 *     summary: Mendapatkan Matriks Hak Akses (Role-Permission)
 *     description: Mengambil data daftar role dan permission serta pemetaannya (matriks). Akses khusus Super Admin (Role ID 1) yang memiliki izin manage-roles.
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data matriks role-permission
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, "manage-roles");
    if (!allowed) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const matrixData = await getRolePermissionMatrix();
    return NextResponse.json(matrixData);
  } catch (error: any) {
    console.error("Error in GET /api/permissions:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/permissions:
 *   put:
 *     summary: Memperbarui hak akses (permissions) suatu Role
 *     description: Mengubah daftar permission (fitur/akses) yang dimiliki oleh sebuah role. Akses khusus Super Admin.
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - permissionIds
 *             properties:
 *               roleId:
 *                 type: integer
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Hak akses role berhasil diperbarui
 *       400:
 *         description: Format request tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin
 *       500:
 *         description: Kesalahan server internal
 */
import { updatePermissionsSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = await hasPermission(effectiveRoleId, "manage-roles");
    if (!allowed) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const body = await req.json();
    const validated = updatePermissionsSchema.parse(body);

    const result = await updateRolePermissions(validated.roleId, validated.permissionIds, session.user.id);

    const ipAddress = await getClientIp(req);
    createAuditLog({
      userId: session.user.id,
      action: "UPDATE_PERMISSIONS",
      module: "sistem",
      description: `Memperbarui hak akses (permissions) untuk Role ID #${validated.roleId} — ${validated.permissionIds.length} permission ditetapkan.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: "Hak akses role berhasil diperbarui", result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Format request tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in PUT /api/permissions:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui hak akses role" },
      { status: 500 }
    );
  }
}

