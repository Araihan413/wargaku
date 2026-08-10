import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import {
  updateUserProfile,
  mutateOfficerRole,
  suspendToggleUser,
  resetUserPassword,
  getUserFullProfile,
  revokeCoordinatorFromProperties,
} from "@/db/queries/auth/user.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { updateUserSchema } from "@/lib/validations/user";
import { notifyUser } from "@/lib/notifications";
import { ZodError } from "zod";
import { getAppBaseUrl, generateTemporaryPassword } from "@/lib/config";
import { sendPasswordResetEmail } from "@/lib/mail";

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Melakukan aksi terhadap pengguna tertentu
 *     description: Mengizinkan admin (atau role dengan izin yang sesuai) untuk melakukan aksi terhadap pengguna seperti memperbarui profil, mengubah role/jabatan, menangguhkan/mengaktifkan akun, mereset password, atau mencabut peran koordinator.
 *     tags:
 *       - Pengguna
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pengguna
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [update_profile, mutate_role, suspend_toggle, revoke_coordinator, reset_password]
 *                 description: Aksi yang akan dilakukan terhadap pengguna
 *               payload:
 *                 type: object
 *                 description: Data yang diperlukan untuk aksi yang dipilih
 *     responses:
 *       200:
 *         description: Aksi berhasil dilakukan
 *       400:
 *         description: Permintaan tidak valid atau payload tidak sesuai
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Pengguna tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const hasManageUsers = await hasPermission(effectiveRoleId, "manage-users");
    const hasManageResidents = await hasPermission(effectiveRoleId, "manage-residents");

    const { id } = await params;
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Check if user is allowed to perform this action
    let isAllowed = hasManageUsers;

    // Allow users with manage-residents permission to manage coordinators (roleId = 5)
    if (!isAllowed && hasManageResidents) {
      // If action is update_profile or suspend_toggle or mutate_role, check if they are acting on a coordinator
      // (For mutate_role, we only allow it if the target role is coordinator or they are stripping a coordinator role. 
      //  To be safe, we allow it if payload.roleId === 5 or payload.officerRoleId === 5)
      const targetRole = payload?.roleId || payload?.officerRoleId;
      
      // We can also allow it if we're just updating profile/status for a coordinator
      if (
        (action === "update_profile" && targetRole === 5) ||
        (action === "suspend_toggle" && payload?.roleId === 5) || 
        (action === "mutate_role" && (targetRole === 5 || targetRole === null)) ||
        (action === "revoke_coordinator")
      ) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "update_profile") {
      const validatedData = updateUserSchema.parse(payload);
      await updateUserProfile(id, validatedData);
      return NextResponse.json({ success: true, message: "Profil pengguna berhasil diperbarui" });
    }

    if (action === "mutate_role") {
      const officerRoleId = payload.officerRoleId !== undefined
        ? payload.officerRoleId
        : (typeof payload.roleId === "number" && [2, 3, 4].includes(payload.roleId) ? payload.roleId : null);

      await mutateOfficerRole(id, officerRoleId, session.user.id);

      const targetUser = await getUserFullProfile(id);
      const ipAddress = await getClientIp(request);
      await createAuditLog({
        userId: session.user.id,
        action: "MUTATE_ROLE",
        module: "pengguna",
        description: `Mengubah role/jabatan pengguna ${targetUser?.name || id} menjadi Role ID #${officerRoleId || 6}`,
        ipAddress,
      });

      notifyUser(id, {
        title: "Perubahan Jabatan",
        message: `Jabatan Anda dalam sistem Wargaku telah diubah oleh Admin. Silakan login kembali untuk melihat perubahan akses.`,
        category: "personal",
        redirectLink: "/dashboard",
      });

      return NextResponse.json({ success: true, message: "Jabatan pengurus berhasil dimutasi" });
    }

    if (action === "suspend_toggle") {
      const { status } = payload;
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await suspendToggleUser(id, status, session.user.id);

      const targetUser = await getUserFullProfile(id);
      const ipAddress = await getClientIp(request);
      const isSuspended = status === "suspended";
      await createAuditLog({
        userId: session.user.id,
        action: isSuspended ? "SUSPEND_USER" : "ACTIVATE_USER",
        module: "pengguna",
        description: `${isSuspended ? "Menangguhkan (suspend)" : "Mengaktifkan kembali"} akun pengguna: ${targetUser?.name || id} (${targetUser?.email || ''})`,
        ipAddress,
      });

      notifyUser(id, {
        title: isSuspended ? "Akun Ditangguhkan" : "Akun Diaktifkan Kembali",
        message: isSuspended
          ? "Akun Anda telah ditangguhkan (suspended) oleh Admin. Hubungi Pengurus RT untuk informasi lebih lanjut."
          : "Akun Anda telah diaktifkan kembali oleh Admin. Silakan login untuk mengakses sistem.",
        category: "personal",
        redirectLink: "/login",
      });

      return NextResponse.json({
        success: true,
        message: status === "suspended" ? "Akun berhasil ditangguhkan" : "Akun berhasil diaktifkan",
      });
    }

    if (action === "revoke_coordinator") {
      const { propertyIds } = payload;
      if (!Array.isArray(propertyIds)) {
        return NextResponse.json({ error: "propertyIds must be an array" }, { status: 400 });
      }

      const revokedCount = await revokeCoordinatorFromProperties(id, propertyIds);

      const targetUser = await getUserFullProfile(id);
      const ipAddress = await getClientIp(request);
      await createAuditLog({
        userId: session.user.id,
        action: "REVOKE_COORDINATOR",
        module: "pengguna",
        description: `Mencabut jabatan koordinator untuk pengguna ${targetUser?.name || id} dari ${revokedCount} properti.`,
        ipAddress,
      });

      return NextResponse.json({
        success: true,
        message: "Jabatan koordinator berhasil dicabut secara parsial",
      });
    }

    if (action === "reset_password") {
      const user = await getUserFullProfile(id);
      if (!user) {
        return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
      }

      const temporaryPassword = generateTemporaryPassword();
      await resetUserPassword(id, temporaryPassword);

      const ipAddress = await getClientIp(request);
      await createAuditLog({
        userId: session.user.id,
        action: "RESET_PASSWORD",
        module: "pengguna",
        description: `Mereset password akun pengguna: ${user.name} (${user.email})`,
        ipAddress,
      });

      const baseUrl = getAppBaseUrl(request);
      const loginUrl = `${baseUrl}/login`;

      try {
        await sendPasswordResetEmail({
          toEmail: user.email,
          userName: user.name,
          temporaryPassword,
          loginUrl,
        });
      } catch (emailErr) {
        console.error("Gagal mengirim email reset password:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: `Password berhasil direset. Password sementara: ${temporaryPassword}`,
        temporaryPassword,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Input tidak valid", issues: error.issues }, { status: 400 });
    }
    if (
      error?.message?.startsWith("FORBIDDEN_ADMIN_PROMOTION") ||
      error?.message?.startsWith("FORBIDDEN_ADMIN_DEMOTION") ||
      error?.message?.startsWith("ADMIN_SINGLE_ROLE_EXCLUSIVE") ||
      error?.message?.startsWith("SELF_ROLE_CHANGE") ||
      error?.message?.startsWith("SA_MUTUAL_PROTECTION")
    ) {
      const parts = error.message.split(":");
      return NextResponse.json({ error: parts[1] || parts[0] }, { status: 400 });
    }
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
