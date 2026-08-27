import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { setUserPrimaryRole, getUserFullProfile, createAuditLog } from "@/db/queries";
import { setPrimaryRoleSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/user/profile/set-primary-role:
 *   post:
 *     summary: Mengubah peran utama default pengguna
 *     description: Mengubah role utama (is_primary = true) bagi pengguna yang memiliki banyak peran (multi-role). Hanya role yang sudah dimiliki sah oleh pengguna yang dapat dipilih.
 *     tags:
 *       - Pengguna & Profil
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
 *             properties:
 *               roleId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Peran utama berhasil diperbarui
 *       400:
 *         description: Parameter roleId tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Pengguna tidak memiliki peran yang diminta
 *       500:
 *         description: Gagal memperbarui peran utama
 */
export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await req.json();
    const validated = setPrimaryRoleSchema.parse(body);
    const roleId = validated.roleId;

    await setUserPrimaryRole(session.user.id, roleId);


    const updatedProfile = await getUserFullProfile(session.user.id);
    const targetRoleName = updatedProfile?.roles?.find((r) => r.roleId === roleId)?.roleName || `Role #${roleId}`;

    // Catat Audit Log
    try {
      await createAuditLog({
        userId: session.user.id,
        action: "UPDATE_PRIMARY_ROLE",
        module: "profile",
        description: `Pengguna ${session.user.name || session.user.email} mengubah tampilan peran utama saat login menjadi ${targetRoleName}`,
      });
    } catch (auditErr) {
      console.error("Gagal mencatat audit log UPDATE_PRIMARY_ROLE:", auditErr);
    }

    return NextResponse.json({
      message: "Tampilan peran utama berhasil diperbarui",
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "ID peran tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("POST /api/user/profile/set-primary-role error:", error);
    if (error?.message === "ROLE_NOT_OWNED") {
      return NextResponse.json(
        { error: "Anda tidak memiliki peran tersebut" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui peran utama" },
      { status: 500 }
    );
  }
}

