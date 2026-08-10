import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadSingleFile } from "@/lib/file-processor/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Mengunggah berkas
 *     description: Mengunggah gambar (JPG/PNG/WebP) atau dokumen (PDF) ke layanan Cloudinary.
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 description: Folder tujuan (contoh "kk", "ktp", "complaints")
 *               oldFileUrl:
 *                 type: string
 *                 description: URL berkas lama yang akan dihapus setelah unggahan baru
 *     responses:
 *       200:
 *         description: Berkas berhasil diunggah
 *       400:
 *         description: Berkas tidak valid atau terlalu besar
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "documents";
    const oldFileUrl = formData.get("oldFileUrl") as string | null;

    if (!session && folder !== "complaints") {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "Berkas tidak ditemukan dalam data form." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas melebihi batas maksimal 5 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format berkas tidak didukung. Harap unggah gambar (JPG/PNG/WebP) atau dokumen PDF." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If uploading KK or KTP, instruct Cloudinary to convert it to PDF
    const format = (folder === "kk" || folder === "ktp") ? "pdf" : undefined;
    const result = await uploadSingleFile({
      buffer,
      folder,
      fileName: file.name,
      format,
      oldFileUrl,
    });

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      resourceType: result.resourceType,
    });
  } catch (error: any) {
    console.error("Error in POST /api/upload:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengunggah berkas ke server." },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/upload:
 *   delete:
 *     summary: Menghapus berkas
 *     description: Menghapus berkas dari Cloudinary berdasarkan URL atau Public ID.
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               publicId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil menghapus berkas
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const { url, publicId } = await request.json();
    let success = false;

    if (publicId) {
      const { deleteFromCloudinary } = await import("@/lib/cloudinary");
      success = await deleteFromCloudinary(publicId);
    } else if (url) {
      const { deleteCloudinaryFileByUrl } = await import("@/lib/cloudinary");
      success = await deleteCloudinaryFileByUrl(url);
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("Error in DELETE /api/upload:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menghapus berkas." },
      { status: 500 }
    );
  }
}
