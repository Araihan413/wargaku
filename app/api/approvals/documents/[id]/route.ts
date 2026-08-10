import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { updateFamily, getFamilyById } from "@/db/queries/population/family.queries";
import { getTenantContractById, updateTenantContract } from "@/db/queries/property/tenant.queries";
import { createNotification } from "@/db/queries/system/notification.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";

/**
 * @openapi
 * /api/approvals/documents/{id}:
 *   patch:
 *     summary: Memproses verifikasi dokumen kependudukan
 *     description: Memproses persetujuan (approve) atau penolakan (reject) berkas Kartu Keluarga atau Bukti Domisili Sewa. Akan mengirimkan notifikasi kepada pemilik dokumen jika disetujui/ditolak. Membutuhkan izin verify-documents.
 *     tags:
 *       - Verifikasi & Persetujuan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kartu Keluarga (jika type=family) atau ID Tenant Contract (jika type=rental_resident)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - action
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [family, rental_resident]
 *                 description: Jenis dokumen yang diverifikasi
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejectReason:
 *                 type: string
 *                 description: Alasan penolakan (wajib jika action = reject)
 *     responses:
 *       200:
 *         description: Dokumen berhasil diproses
 *       400:
 *         description: Parameter/Input tidak valid atau alasan penolakan kosong
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Data (KK/Penghuni Sewa) tidak ditemukan
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
    const isAllowed = await hasPermission(effectiveRoleId, "verify-documents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = Number(id);

    if (isNaN(documentId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { type, action, rejectReason } = body;

    if (!type || (type !== "family" && type !== "rental_resident")) {
      return NextResponse.json({ error: "Tipe dokumen tidak valid (harus family atau rental_resident)" }, { status: 400 });
    }

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Aksi tidak valid (harus approve atau reject)" }, { status: 400 });
    }

    const status = action === "approve" ? "verified" : "rejected";
    const note = action === "reject" ? rejectReason || "Dokumen tidak sesuai / tidak valid." : null;

    if (action === "reject" && !rejectReason?.trim()) {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    }

    if (type === "family") {
      const family = await getFamilyById(documentId);
      if (!family) {
        return NextResponse.json({ error: "Kartu Keluarga tidak ditemukan" }, { status: 404 });
      }

      await updateFamily(documentId, {
        verificationStatus: status,
        verificationNote: note,
      });

      const ipAddress = await getClientIp(request);
      await createAuditLog({
        userId: session.user.id,
        action: action === "approve" ? "VERIFY_FAMILY_CARD" : "REJECT_FAMILY_CARD",
        module: "persetujuan",
        description: `${action === "approve" ? "Menyetujui verifikasi berkas" : "Menolak berkas"} Kartu Keluarga No. ${family.familyNumber || `#${documentId}`}${note ? ` (Catatan: ${note})` : ''}`,
        ipAddress,
      });

      try {
        if (family.headUserId) {
          await createNotification({
            userId: family.headUserId,
            title: action === "approve" ? "Kartu Keluarga Terverifikasi" : "Kartu Keluarga Ditolak",
            message: action === "approve"
              ? "Berkas Kartu Keluarga Anda telah berhasil diverifikasi dan disetujui oleh Ketua RT."
              : `Pengajuan berkas Kartu Keluarga Anda ditolak oleh Ketua RT. Alasan: "${note}"`,
            category: "personal",
            redirectLink: "/dashboard/family",
          });
        }
      } catch (notifErr) {
        console.error("Failed to create notification for Warga:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: action === "approve" 
          ? "Berkas Kartu Keluarga berhasil diverifikasi & disetujui" 
          : "Berkas Kartu Keluarga ditolak",
      });
    } else {
      const contract = await getTenantContractById(documentId);
      if (!contract) {
        return NextResponse.json({ error: "Penghuni sewa tidak ditemukan" }, { status: 404 });
      }

      await updateTenantContract(documentId, {
        verificationStatus: status,
        verificationNote: note,
      });

      const ipAddress = await getClientIp(request);
      await createAuditLog({
        userId: session.user.id,
        action: action === "approve" ? "VERIFY_TENANT_KTP" : "REJECT_TENANT_KTP",
        module: "persetujuan",
        description: `${action === "approve" ? "Menyetujui verifikasi berkas KTP" : "Menolak berkas KTP"} penghuni sewa: ${contract.individualName} (NIK: ${contract.individualNik})${note ? ` (Catatan: ${note})` : ''}`,
        ipAddress,
      });

      return NextResponse.json({
        success: true,
        message: action === "approve" 
          ? "Berkas KTP Penghuni berhasil diverifikasi & disetujui" 
          : "Berkas KTP Penghuni ditolak",
      });
    }

  } catch (error: any) {
    console.error("Error in PATCH /api/approvals/documents/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
