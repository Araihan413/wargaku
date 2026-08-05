import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { processRegistrationApproval } from "@/db/queries/system/approval.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";

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
    const { action, rejectReason } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Aksi tidak valid (harus approve atau reject)" }, { status: 400 });
    }

    const requestOrigin = request.headers.get("origin") || undefined;

    await processRegistrationApproval(id, action, rejectReason, requestOrigin);

    const ipAddress = await getClientIp(request);
    const isApprove = action === "approve";
    await createAuditLog({
      userId: session.user.id,
      action: isApprove ? "APPROVE_REGISTRATION" : "REJECT_REGISTRATION",
      module: "persetujuan",
      description: `${isApprove ? "Menyetujui" : "Menolak"} pendaftaran warga mandiri ID #${id}${!isApprove && rejectReason ? ` (Alasan: ${rejectReason})` : ''}`,
      ipAddress,
    });

    if (action === "approve") {
      return NextResponse.json({ success: true, message: "Pendaftaran berhasil disetujui" });
    } else {
      return NextResponse.json({ success: true, message: "Pendaftaran warga berhasil ditolak & email penolakan terkirim" });
    }

  } catch (error: any) {
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
