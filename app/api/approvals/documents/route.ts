import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { listFamilies } from "@/db/queries/population/family.queries";
import { listFamilyChangeRequests } from "@/db/queries/population/family-change-request.queries";
import { listAllTenantContracts } from "@/db/queries/property/tenant.queries";

/**
 * @openapi
 * /api/approvals/documents:
 *   get:
 *     summary: Mendapatkan daftar dokumen penduduk yang perlu diverifikasi
 *     description: Mengambil daftar Kartu Keluarga (KK Baru / Usulan Perubahan Data) atau Bukti Domisili/Sewa yang sedang menunggu persetujuan RT. Membutuhkan izin verify-documents.
 *     tags:
 *       - Verifikasi & Persetujuan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [family, rental_resident]
 *           default: family
 *         description: Tipe dokumen (Kartu Keluarga atau Kontrak Sewa)
 *       - in: query
 *         name: subType
 *         schema:
 *           type: string
 *           enum: [all, registration, change_request]
 *           default: all
 *         description: Jenis pengajuan (Semua, Registrasi Baru, atau Perubahan Data)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *           default: pending
 *         description: Status verifikasi
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan nama/KK
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar dokumen
 *       400:
 *         description: Tipe dokumen tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth("verify-documents");
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "family"; // 'family' atau 'rental_resident'
    const subType = (searchParams.get("subType") || "all") as "all" | "registration" | "change_request";
    const status = (searchParams.get("status") || "pending") as "pending" | "verified" | "rejected";
    const query = searchParams.get("query") || "";

    if (type === "family") {
      let registrationItems: any[] = [];
      let changeRequestItems: any[] = [];

      // 1. Ambil pendaftaran KK baru jika subType === 'all' atau 'registration'
      if (subType === "all" || subType === "registration") {
        const regResult = await listFamilies({
          verificationStatus: status,
          query,
          isActive: true,
          limit: 100,
          offset: 0,
        });
        registrationItems = (regResult.data || []).map((fam) => ({
          ...fam,
          submissionType: "registration",
          submissionLabel: "Registrasi Baru",
          changeRequestId: null,
        }));
      }

      // 2. Ambil usulan perubahan data jika subType === 'all' atau 'change_request'
      if (subType === "all" || subType === "change_request") {
        const crStatus = status === "verified" ? "approved" : status;
        const crResult = await listFamilyChangeRequests({
          status: crStatus as any,
          query,
          limit: 100,
          offset: 0,
        });
        changeRequestItems = (crResult.data || []).map((cr) => ({
          id: cr.familyId,
          changeRequestId: cr.id,
          familyNumber: cr.familyNumber,
          headUserId: cr.headUserId,
          headName: cr.headName,
          blockNumber: cr.blockNumber,
          houseNumber: cr.houseNumber,
          dwellingType: cr.dwellingType,
          verificationStatus: status,
          verificationNote: cr.rejectionNote,
          kkFile: cr.kkFile,
          isActive: true,
          createdAt: cr.createdAt,
          checkInDate: cr.submittedAt || cr.createdAt,
          updatedAt: cr.updatedAt,
          memberCount: cr.memberCount,
          submissionType: "change_request",
          submissionLabel: "Perubahan Data",
        }));
      }

      const combined = [...registrationItems, ...changeRequestItems].sort((a, b) => {
        const dateA = new Date(a.checkInDate || a.createdAt).getTime();
        const dateB = new Date(b.checkInDate || b.createdAt).getTime();
        return dateB - dateA;
      });

      return NextResponse.json({ data: combined });
    } else if (type === "rental_resident") {
      const result = await listAllTenantContracts({
        query,
        verificationStatus: status,
        isActive: true,
        limit: 100,
        offset: 0,
      });
      return NextResponse.json({ data: result.data || [] });
    } else {
      return NextResponse.json({ error: "Tipe dokumen tidak valid" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in GET /api/approvals/documents:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
