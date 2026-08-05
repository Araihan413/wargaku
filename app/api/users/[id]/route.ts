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
} from "@/db/queries/auth/user.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { updateUserSchema } from "@/lib/validations/user";
import { notifyUser } from "@/lib/notifications";
import { ZodError } from "zod";
import { getAppBaseUrl, generateTemporaryPassword } from "@/lib/config";
import { sendPasswordResetEmail } from "@/lib/mail";

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
    const allowed = await hasPermission(effectiveRoleId, "manage-users");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
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
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
