import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { listSmartGroups, createSmartGroup } from "@/db/queries/system/smart-group.queries";
import { createSmartGroupSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/smart-groups:
 *   get:
 *     summary: Mendapatkan daftar Kelompok Warga Pintar (Smart Groups)
 *     description: Mengambil daftar semua smart groups yang tersimpan di sistem.
 *     tags:
 *       - Smart Groups
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar kelompok
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateApiAuth("view-residents");
    if (errorResponse || !session) return errorResponse;

    const data = await listSmartGroups();
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in GET /api/smart-groups:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/smart-groups:
 *   post:
 *     summary: Membuat Kelompok Warga Pintar baru
 *     description: Membuat smart group baru berdasarkan kriteria (rules) yang ditentukan.
 *     tags:
 *       - Smart Groups
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
 *               - criteria
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               criteria:
 *                 type: object
 *                 description: Struktur JSON kriteria/filter
 *     responses:
 *       200:
 *         description: Kelompok warga berhasil disimpan
 *       400:
 *         description: Validasi input gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth("manage-residents");
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validated = createSmartGroupSchema.parse(body);

    const smartGroupId = await createSmartGroup({
      name: validated.name,
      description: validated.description || undefined,
      criteria: validated.criteria,
      createdBy: session.user.id,
    });

    return NextResponse.json({ id: smartGroupId, message: "Kelompok warga berhasil disimpan" });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in POST /api/smart-groups:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

