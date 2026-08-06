import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission, getEffectiveRoleId } from "@/lib/rbac";
import { listUsers, listRoles, createUserWithAccount, createAuditLog } from "@/db/queries";
import { getClientIp } from "@/lib/audit-logger";
import { createUserSchema } from "@/lib/validations/user";
import { sendEmail } from "@/lib/mail";
import { getAdminCreatedUserCredentialsEmail } from "@/lib/emails/templates";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const allowed = 
      await hasPermission(effectiveRoleId, "manage-users") ||
      await hasPermission(effectiveRoleId, "manage-residents") ||
      await hasPermission(effectiveRoleId, "view-residents");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;
    const roleIdParam = searchParams.get("roleId") ? parseInt(searchParams.get("roleId")!, 10) : undefined;
    const status = searchParams.get("status") as "pending" | "active" | "suspended" | null || undefined;
    const query = searchParams.get("query") || undefined;
    const withoutFamily = searchParams.get("withoutFamily") === "true";
    const excludeExceptId = searchParams.get("excludeExceptId") || undefined;

    const usersData = await listUsers({ limit, offset, roleId: roleIdParam, status, query, withoutFamily, excludeExceptId });
    const rolesData = await listRoles();

    return NextResponse.json({
      users: usersData.data,
      metadata: usersData.metadata,
      roles: rolesData,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const effectiveRoleId = await getEffectiveRoleId(session);
    const rolesList = Array.isArray(validatedData.roles) ? validatedData.roles : [(validatedData as any).roleId ?? 6];
    const isWargaOnly = rolesList.length === 1 && rolesList[0] === 6;

    const allowed = 
      await hasPermission(effectiveRoleId, "manage-users") ||
      (await hasPermission(effectiveRoleId, "manage-residents") && isWargaOnly);
      
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newUser = await createUserWithAccount(validatedData);

    let emailSent = false;
    try {
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const loginLink = `${origin}/login`;
      const emailHtml = getAdminCreatedUserCredentialsEmail(
        newUser.name,
        newUser.email,
        newUser.generatedPassword,
        loginLink
      );

      const emailResult = await sendEmail({
        to: { email: newUser.email, name: newUser.name },
        subject: "Akun Wargaku Anda Telah Dibuat",
        htmlContent: emailHtml,
      });

      emailSent = !!emailResult;
    } catch (mailErr) {
      console.error("Gagal mengirim email kredensial ke user baru:", mailErr);
    }

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE_USER",
      module: "pengguna",
      description: `Membuat akun pengguna baru: ${newUser.name} (${newUser.email}) - Roles #${newUser.roleIds?.join(", ") ?? newUser.roleId}`,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        roleIds: newUser.roleIds,
      },
      generatedPassword: newUser.generatedPassword,
      emailSent,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0]?.message || "Input tidak valid";
      return NextResponse.json({ error: firstIssue, issues: error.issues }, { status: 400 });
    }
    if (error?.message?.startsWith("OFFICER_EXISTS")) {
      const parts = error.message.split(":");
      return NextResponse.json({ error: `Jabatan ${parts[1] || "Pengurus"} sudah diisi oleh ${parts[2] || "pengguna lain"}.` }, { status: 400 });
    }
    if (error?.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "Email sudah terdaftar di sistem." }, { status: 400 });
    }
    if (error?.message?.startsWith("NIK_ALREADY_LINKED")) {
      return NextResponse.json({ error: "NIK ini sudah terhubung dengan akun Kepala Keluarga lain." }, { status: 400 });
    }
    if (error?.message?.startsWith("NIK_ALREADY_EXISTS")) {
      return NextResponse.json({ error: "NIK ini sudah terdaftar sebagai Kepala Keluarga di KK lain." }, { status: 400 });
    }
    if (error?.message?.startsWith("FAMILY_NUMBER_EXISTS")) {
      return NextResponse.json({ error: "Nomor KK ini sudah terdaftar dengan Kepala Keluarga lain." }, { status: 400 });
    }
    if (error?.message?.startsWith("INVALID_DWELLING")) {
      return NextResponse.json({ error: "Alamat hunian tidak valid atau bertipe Homestay." }, { status: 400 });
    }
    if (error?.message === "SUPERADMIN_LIMIT_REACHED") {
      return NextResponse.json({ error: "Batas maksimal 2 Super Admin telah tercapai." }, { status: 400 });
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
