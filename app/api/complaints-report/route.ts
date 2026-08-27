import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import {
  getComplaintsReportOverview,
  getComplaintsReportList,
  getAnnouncementsReportList,
  getActivitiesReportList,
} from "@/db/queries/reports";

/**
 * @openapi
 * /api/complaints-report:
 *   get:
 *     summary: Mendapatkan laporan agregat (Pengaduan, Pengumuman, Kegiatan)
 *     description: Mengambil data ringkasan dan daftar laporan untuk pengaduan, pengumuman, atau kegiatan (tergantung parameter `type`). Hanya dapat diakses oleh Super Admin.
 *     tags:
 *       - Pengaduan & Aspirasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [complaints, announcements, activities]
 *           default: complaints
 *         description: Jenis laporan yang ingin diambil
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter status (khusus type complaints)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter kategori (khusus complaints/announcements)
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Filter waktu (khusus type activities, misal all, upcoming, past)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan laporan dan ringkasan
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(req: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    if (roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "complaints";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";
    const filter = searchParams.get("filter") || "all";

    const overview = await getComplaintsReportOverview();
    let listResult;

    if (type === "announcements") {
      listResult = await getAnnouncementsReportList({ page, limit, category, search });
    } else if (type === "activities") {
      listResult = await getActivitiesReportList({ page, limit, filter, search });
    } else {
      listResult = await getComplaintsReportList({ page, limit, status, category, search });
    }

    return NextResponse.json({
      overview,
      type,
      data: listResult.data,
      pagination: listResult.pagination,
    });
  } catch (error: any) {
    console.error("Error in GET /api/complaints-report:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
