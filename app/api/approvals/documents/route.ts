import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { listFamilies } from "@/db/queries/population/family.queries";
import { listAllTenantContracts } from "@/db/queries/property/tenant.queries";

/**
 * @openapi
 * /api/approvals/documents:
 *   get:
 *     summary: Mendapatkan daftar dokumen penduduk yang perlu diverifikasi
 *     description: Mengambil daftar Kartu Keluarga (KK) atau Bukti Domisili/Sewa (untuk Warga Sewa) yang sedang menunggu persetujuan RT. Membutuhkan izin verify-documents.
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "verify-documents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "family"; // 'family' atau 'rental_resident'
    const status = (searchParams.get("status") || "pending") as "pending" | "verified" | "rejected";
    const query = searchParams.get("query") || "";

    if (type === "family") {
      const result = await listFamilies({
        verificationStatus: status,
        query,
        isActive: true,
        limit: 100,
        offset: 0,
      });
      return NextResponse.json({ data: result.data || [] });
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
