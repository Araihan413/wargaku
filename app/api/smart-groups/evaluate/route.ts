import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { filterCitizens } from "@/db/queries/residents/citizen-filter.queries";

/**
 * @openapi
 * /api/smart-groups/evaluate:
 *   post:
 *     summary: Mengevaluasi kriteria Smart Group
 *     description: Menguji/mengevaluasi JSON criteria secara langsung dan mengembalikan daftar warga yang cocok (match). Digunakan untuk preview sebelum menyimpan.
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
 *             properties:
 *               criteria:
 *                 type: object
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar warga hasil evaluasi
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
import { evaluateSmartGroupSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "view-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const body = await request.json();
    const validated = evaluateSmartGroupSchema.parse(body.criteria ? body : { criteria: body });

    const data = await filterCitizens(validated.criteria);

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Kriteria tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in POST /api/smart-groups/evaluate:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

