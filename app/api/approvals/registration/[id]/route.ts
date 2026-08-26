import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { processRegistrationApproval } from "@/db/queries/system/approval.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { processRegistrationApprovalSchema } from "@/lib/validations/system";
import { ZodError } from "zod";


/**
 * @openapi
 * /api/approvals/registration/{id}:
 *   patch:
 *     summary: Memproses persetujuan atau penolakan registrasi pengguna
 *     description: Mengubah status pengguna yang mendaftar dari 'pending' menjadi 'active' (approve) atau 'rejected' (reject). Jika ditolak, akan mengirimkan email penolakan. Hanya dapat diakses oleh pengguna dengan izin verify-registrations.
 *     tags:
 *       - Verifikasi & Persetujuan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user yang mendaftar
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
 *                 enum: [approve, reject]
 *               rejectReason:
 *                 type: string
 *                 description: Alasan penolakan (opsional, akan disertakan dalam email jika ditolak)
 *     responses:
 *       200:
 *         description: Pendaftaran berhasil diproses
 *       400:
 *         description: Aksi tidak valid atau pengguna sudah diproses sebelumnya
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
    const isAllowed = await hasPermission(effectiveRoleId, "verify-registrations");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = processRegistrationApprovalSchema.parse(body);

    const requestOrigin = request.headers.get("origin") || undefined;

    await processRegistrationApproval(id, validated.action, validated.rejectReason || undefined, requestOrigin);

    const ipAddress = await getClientIp(request);
    const isApprove = validated.action === "approve";
    await createAuditLog({
      userId: session.user.id,
      action: isApprove ? "APPROVE_REGISTRATION" : "REJECT_REGISTRATION",
      module: "persetujuan",
      description: `${isApprove ? "Menyetujui" : "Menolak"} pendaftaran warga mandiri ID #${id}${!isApprove && validated.rejectReason ? ` (Alasan: ${validated.rejectReason})` : ''}`,
      ipAddress,
    });

    if (validated.action === "approve") {
      return NextResponse.json({ success: true, message: "Pendaftaran berhasil disetujui" });
    } else {
      return NextResponse.json({ success: true, message: "Pendaftaran warga berhasil ditolak & email penolakan terkirim" });
    }

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (error.message === "NOT_PENDING") {
      return NextResponse.json({ error: "User sudah diproses sebelumnya" }, { status: 400 });
    }
    console.error("Error in PATCH /api/approvals/registration/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
