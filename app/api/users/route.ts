import { NextResponse } from "next/server";
import { validateApiAuth, hasPermission } from "@/lib/rbac";
import { listUsers, listRoles, createUserWithAccount, createAuditLog } from "@/db/queries";
import { getClientIp } from "@/lib/audit-logger";
import { createUserSchema } from "@/lib/validations/user";
import { sendEmail } from "@/lib/mail";
import { getAdminCreatedUserCredentialsEmail } from "@/lib/emails/templates";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar pengguna
 *     description: Mengambil daftar pengguna berdasarkan filter. Membutuhkan akses admin (kecuali pencarian publik).
 *     tags:
 *       - Pengguna
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: publicSearch
 *         schema:
 *           type: boolean
 *         description: Mode pencarian publik (bisa diakses tanpa akses admin penuh)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID peran (role)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, suspended]
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian nama/email pengguna
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pengguna
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const isPublicSearch = searchParams.get("publicSearch") === "true";

    const allowed = 
      await hasPermission(roleId, "manage-users") ||
      await hasPermission(roleId, "manage-residents") ||
      await hasPermission(roleId, "view-residents");

    if (!allowed && !isPublicSearch) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;
    const roleIdParam = searchParams.get("roleId") ? parseInt(searchParams.get("roleId")!, 10) : undefined;
    const status = searchParams.get("status") as "pending" | "active" | "suspended" | null || undefined;
    const query = searchParams.get("query") || undefined;
    const withoutFamily = searchParams.get("withoutFamily") === "true";
    const excludeExceptId = searchParams.get("excludeExceptId") || undefined;
    const excludeRoleIds = searchParams.get("excludeRoleIds") 
      ? searchParams.get("excludeRoleIds")!.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : undefined;

    const usersData = await listUsers({ limit, offset, roleId: roleIdParam, status, query, withoutFamily, excludeExceptId, excludeRoleIds });
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

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Membuat akun pengguna baru (Admin)
 *     description: Menambahkan pengguna baru ke dalam sistem dan mengirimkan email kredensial.
 *     tags:
 *       - Pengguna
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - roles
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *               familyNumber:
 *                 type: string
 *               familyRole:
 *                 type: string
 *               isHeadOfFamily:
 *                 type: boolean
 *               dwellingId:
 *                 type: integer
 *               blockId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Pengguna berhasil dibuat
 *       400:
 *         description: Validasi input gagal, email sudah digunakan, atau pelanggaran logika bisnis lainnya
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const rolesList = Array.isArray(validatedData.roles) ? validatedData.roles : [(validatedData as any).roleId ?? 6];
    const isWargaOnly = rolesList.length === 1 && rolesList[0] === 6;

    const allowed = 
      await hasPermission(roleId, "manage-users") ||
      (await hasPermission(roleId, "manage-residents") && isWargaOnly);
      
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
