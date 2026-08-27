import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { validateApiAuth } from "@/lib/rbac";
import { getDocumentAccess } from "@/db/queries/system/document.queries";
import { generateSignedUrl, extractPublicIdFromUrl } from "@/lib/cloudinary";

/**
 * Render halaman HTML error premium jika dibuka langsung di browser tanpa sesi login (misal di Tab Samaran).
 */
function renderAccessDeniedHtml(message: string, isUnauthorized = true): string {
  const title = isUnauthorized ? "Akses Dokumen Dilindungi" : "Izin Akses Ditolak";
  const statusBadge = isUnauthorized ? "401 - Belum Login" : "403 - Akses Dilarang";
  const iconSvg = isUnauthorized
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - WargaKu</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.5rem; max-width: 440px; width: 100%; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .icon-wrapper { display: inline-flex; align-items: center; justify-content: center; width: 5rem; height: 5rem; border-radius: 1.25rem; background: ${isUnauthorized ? "#eff6ff" : "#fff1f2"}; margin-bottom: 1.5rem; border: 1px solid ${isUnauthorized ? "#bfdbfe" : "#fecdd3"}; }
    .badge { display: inline-block; font-size: 0.75rem; font-weight: 700; color: ${isUnauthorized ? "#1d4ed8" : "#be123c"}; background: ${isUnauthorized ? "#dbeafe" : "#ffe4e6"}; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; }
    p { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin-bottom: 2rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 0.875rem; padding: 0.875rem 1.5rem; border-radius: 0.875rem; text-decoration: none; transition: background 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
    .btn:hover { background: #1d4ed8; }
    .footer { margin-top: 1.75rem; font-size: 0.75rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      ${iconSvg}
    </div>
    <br/>
    <span class="badge">${statusBadge}</span>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/login" class="btn">Masuk / Login ke WargaKu</a>
    <div class="footer">Sistem Informasi Pengelolaan Lingkungan RT &bull; WargaKu</div>
  </div>
</body>
</html>`;
}

/**
 * GET /api/documents/stream
 *
 * Streaming endpoint untuk dokumen sensitif (KK, KTP, Nota).
 * Memvalidasi sesi dan RBAC pada setiap request. Mengalirkan buffer file langsung ke browser
 * sehingga URL Cloudinary asli tidak pernah dipaparkan dan file 100% tidak bisa dibuka di Tab Samaran / tanpa login.
 */
export async function GET(request: Request) {
  try {
    const { session, roleId: effectiveRoleId } = await validateApiAuth();
    const reqHeaders = await headers();
    const acceptHeader = reqHeaders.get("accept") || "";
    const isHtmlRequest = acceptHeader.includes("text/html");

    // 1. Validasi Autentikasi Sesi
    if (!session) {
      if (isHtmlRequest) {
        return new NextResponse(
          renderAccessDeniedHtml("Dokumen kependudukan ini bersifat rahasia dan dilindungi. Silakan login ke akun WargaKu Anda untuk melihat berkas ini.", true),
          { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      return NextResponse.json({ error: "Belum terautentikasi. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const idParam = searchParams.get("id");
    const isDownload = searchParams.get("download") === "1";
    const id = Number(idParam);

    if (!type || !idParam || isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Parameter 'type' dan 'id' wajib diisi dengan nilai yang valid." }, { status: 400 });
    }

    const accessResult = await getDocumentAccess(type, id, session.user.id, effectiveRoleId);

    if (!accessResult.success || !accessResult.fileUrl) {
      if (isHtmlRequest && accessResult.status === 403) {
        return new NextResponse(
          renderAccessDeniedHtml(accessResult.errorMessage || "Anda tidak memiliki izin untuk mengakses dokumen ini.", false),
          { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      return NextResponse.json({ error: accessResult.errorMessage }, { status: accessResult.status });
    }

    const fileUrl = accessResult.fileUrl;
    const defaultFilename = accessResult.defaultFilename || `dokumen-${type}-${id}.pdf`;


    // 3. Ambil Berkas dari Cloudinary (Server-to-Server)
    const publicId = extractPublicIdFromUrl(fileUrl, true);
    if (!publicId) {
      return NextResponse.json({ error: "Format URL berkas tidak valid." }, { status: 422 });
    }

    let deliveryType: 'authenticated' | 'upload' | 'private' = 'authenticated';
    if (fileUrl.includes('/upload/')) deliveryType = 'upload';
    else if (fileUrl.includes('/private/')) deliveryType = 'private';

    let fileBuffer: ArrayBuffer | null = null;
    let contentType = "application/pdf";

    // Coba Fetch 1: Cloudinary Signed URL dengan resource_type 'image'
    try {
      const signedUrlImage = generateSignedUrl(publicId, "image", 120, deliveryType);
      const res = await fetch(signedUrlImage);
      if (res.ok) {
        contentType = res.headers.get("content-type") || "application/pdf";
        fileBuffer = await res.arrayBuffer();
      }
    } catch {}

    // Coba Fetch 2 (Fallback): Cloudinary Signed URL dengan resource_type 'raw'
    if (!fileBuffer) {
      try {
        const signedUrlRaw = generateSignedUrl(publicId, "raw", 120, deliveryType);
        const res = await fetch(signedUrlRaw);
        if (res.ok) {
          contentType = res.headers.get("content-type") || "application/pdf";
          fileBuffer = await res.arrayBuffer();
        }
      } catch {}
    }

    // Coba Fetch 3 (Fallback): Fetch direct URL tersimpan jika tipe upload publik
    if (!fileBuffer && fileUrl.startsWith("http")) {
      try {
        const res = await fetch(fileUrl);
        if (res.ok) {
          contentType = res.headers.get("content-type") || "application/pdf";
          fileBuffer = await res.arrayBuffer();
        }
      } catch {}
    }

    if (!fileBuffer) {
      console.error("[Stream API] Gagal mengunduh berkas dari semua metode Cloudinary untuk publicId:", publicId);
      return NextResponse.json({ error: "Gagal mengambil berkas dari media storage." }, { status: 502 });
    }

    // Deteksi Content-Type dari buffer jika upstream mengembalikan generic stream/octet-stream
    if (contentType === "application/octet-stream" || contentType === "text/plain") {
      if (defaultFilename.endsWith(".pdf")) contentType = "application/pdf";
      else if (defaultFilename.endsWith(".png")) contentType = "image/png";
      else if (defaultFilename.endsWith(".jpg") || defaultFilename.endsWith(".jpeg")) contentType = "image/jpeg";
    }

    // 4. Stream Buffer ke Browser dengan Header Keamanan Ketat
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${defaultFilename}"`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error: any) {
    console.error("Error in GET /api/documents/stream:", error);
    return NextResponse.json({ error: error?.message || "Kesalahan server internal." }, { status: 500 });
  }
}
