import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { deleteSmartGroup, updateSmartGroup, getSmartGroupById } from "@/db/queries/system/smart-group.queries";
import { updateSmartGroupSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/smart-groups/{id}:
 *   get:
 *     summary: Mendapatkan detail Kelompok Warga Pintar
 *     description: Mengambil detail smart group beserta kriterianya berdasarkan ID.
 *     tags:
 *       - Smart Groups
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail kelompok
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kelompok tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth("view-residents");
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    const data = await getSmartGroupById(smartGroupId);

    if (!data) {
      return NextResponse.json({ error: "Kelompok warga tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in GET /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/smart-groups/{id}:
 *   put:
 *     summary: Memperbarui Kelompok Warga Pintar
 *     description: Mengubah nama, deskripsi, atau kriteria smart group yang sudah ada.
 *     tags:
 *       - Smart Groups
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               criteria:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preset filter berhasil diperbarui
 *       400:
 *         description: Validasi input gagal atau ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth("manage-residents");
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateSmartGroupSchema.parse(body);

    await updateSmartGroup(smartGroupId, validated);

    return NextResponse.json({ message: "Preset filter berhasil diperbarui" });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in PUT /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}


/**
 * @openapi
 * /api/smart-groups/{id}:
 *   delete:
 *     summary: Menghapus Kelompok Warga Pintar
 *     description: Menghapus data smart group secara permanen dari sistem.
 *     tags:
 *       - Smart Groups
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preset filter berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth("manage-residents");
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    await deleteSmartGroup(smartGroupId);

    return NextResponse.json({ message: "Preset filter berhasil dihapus" });
  } catch (error: any) {
    console.error("Error in DELETE /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
