import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId } from "@/lib/rbac";
import { getDocumentAccess } from "@/db/queries/system/document.queries";
import { generateSignedUrl, extractPublicIdFromUrl } from "@/lib/cloudinary";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const idParam = searchParams.get("id");
    const id = Number(idParam);

    if (!type || !idParam || isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Parameter 'type' dan 'id' wajib diisi dengan nilai yang valid." }, { status: 400 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const accessResult = await getDocumentAccess(type, id, session.user.id, effectiveRoleId);

    if (!accessResult.success || !accessResult.fileUrl) {
      return NextResponse.json({ error: accessResult.errorMessage }, { status: accessResult.status });
    }

    const fileUrl = accessResult.fileUrl;

    // ─────────────────────────────────────────────────────────
    // Generate Cloudinary Signed URL (berlaku 10 menit)
    // ─────────────────────────────────────────────────────────
    const publicId = extractPublicIdFromUrl(fileUrl, true);
    if (!publicId) {
      return NextResponse.json({ error: "Format URL berkas tidak valid. Harap unggah ulang berkas." }, { status: 422 });
    }

    let deliveryType: 'authenticated' | 'upload' | 'private' = 'authenticated';
    if (fileUrl.includes('/upload/')) {
      deliveryType = 'upload';
    } else if (fileUrl.includes('/private/')) {
      deliveryType = 'private';
    }

    const signedUrl = generateSignedUrl(publicId, "image", 600, deliveryType);

    return NextResponse.json({ signedUrl });

  } catch (error: any) {
    console.error("Error in GET /api/documents/secure-url:", error);
    return NextResponse.json({ error: error?.message || "Kesalahan server internal." }, { status: 500 });
  }
}

