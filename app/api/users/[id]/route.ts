import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import {
  updateUserProfile,
  mutateUserRole,
  suspendToggleUser,
  resetUserPassword,
} from "@/db/queries/users";
import { updateUserSchema } from "@/lib/validations/user";
import { ZodError } from "zod";

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

    const allowed = await hasPermission(session.user.roleId, "manage-users");
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
      await updateUserProfile(id, validatedData, session.user.id);
      return NextResponse.json({ success: true, message: "Profil pengguna berhasil diperbarui" });
    }

    if (action === "mutate_role") {
      const { roleId } = payload;
      if (typeof roleId !== "number") {
        return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
      }

      await mutateUserRole(id, roleId, session.user.id);
      return NextResponse.json({ success: true, message: "Peran berhasil dimutasi" });
    }

    if (action === "suspend_toggle") {
      const { status } = payload;
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await suspendToggleUser(id, status, session.user.id);
      return NextResponse.json({
        success: true,
        message: status === "suspended" ? "Akun berhasil ditangguhkan" : "Akun berhasil diaktifkan",
      });
    }

    if (action === "reset_password") {
      const defaultPassword = process.env.DEFAULT_PASSWORD!;
      if (!defaultPassword) {
        return NextResponse.json({ error: "Password default tidak ditemukan" }, { status: 500 });
      }

      await resetUserPassword(id, defaultPassword);
      return NextResponse.json({
        success: true,
        message: `Password berhasil di-reset menjadi ${defaultPassword}`,
        defaultPassword,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "SELF_ROLE_CHANGE" || error.message === "SELF_SUSPEND") {
        return NextResponse.json(
          { error: error.message === "SELF_SUSPEND" ? "Anda tidak dapat menangguhkan atau mengaktifkan akun Anda sendiri" : "Anda tidak dapat mengubah peran akun Anda sendiri" },
          { status: 403 }
        );
      }
      if (error.message === "SA_MUTUAL_PROTECTION") {
        return NextResponse.json(
          { error: "Status/profil/peran akun Super Admin lain tidak dapat diubah" },
          { status: 403 }
        );
      }
      if (error.message === "SA_PROMOTION_FORBIDDEN") {
        return NextResponse.json(
          { error: "Peran Super Admin tidak dapat diberikan melalui pembaruan profil atau mutasi peran" },
          { status: 400 }
        );
      }
      if (error.message === "NIK_EXISTS") {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
      }
      if (error.message === "EMAIL_EXISTS") {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
      if (error.message.startsWith("OFFICER_EXISTS:")) {
        const parts = error.message.split(":");
        return NextResponse.json(
          { error: `Akun untuk posisi ${parts[1]} yang aktif/pending sudah ada (${parts[2]})` },
          { status: 400 }
        );
      }
      if (error.message.startsWith("OFFICER_EXISTS_ACTIVATION:")) {
        const parts = error.message.split(":");
        return NextResponse.json(
          { error: `Tidak dapat mengaktifkan akun. Posisi ${parts[1]} yang aktif sudah diisi oleh (${parts[2]})` },
          { status: 400 }
        );
      }
      if (error.message === "SUPERADMIN_LIMIT_REACHED") {
        return NextResponse.json(
          { error: "Batas maksimum 2 akun Super Admin aktif/pending telah tercapai" },
          { status: 400 }
        );
      }
    }
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
