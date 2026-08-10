import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { db } from "@/db";
import { families, familyMembers, rentalContracts, cashTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSignedUrl, extractPublicIdFromUrl } from "@/lib/cloudinary";

/**
 * @openapi
 * /api/documents/secure-url:
 *   get:
 *     summary: Mendapatkan URL aman (Signed URL) untuk dokumen sensitif
 *     description: |
 *       Menghasilkan Cloudinary Signed URL yang berlaku sementara (10 menit) untuk mengakses file sensitif.
 *       Endpoint ini memverifikasi autentikasi dan hak akses (RBAC) kepemilikan sebelum mengembalikan URL.
 *       
 *       Supported types:
 *       - `kk`: file KK keluarga (butuh view-residents atau merupakan KK sendiri)
 *       - `ktp-member`: file KTP anggota keluarga (butuh view-residents atau kepala keluarga sendiri)
 *       - `ktp-tenant`: file KTP penyewa (butuh manage-boarding atau view-residents)
 *       - `receipt`: bukti kas RT (dapat diakses oleh semua pengguna terautentikasi untuk transparansi)
 *     tags:
 *       - Dokumen
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [kk, ktp-member, ktp-tenant, receipt]
 *         description: Jenis dokumen yang diminta
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID record yang terkait (id family, id family_member, id kontrak sewa, atau id transaksi)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan Signed URL
 *       400:
 *         description: Parameter tidak valid atau tipe dokumen tidak dikenali
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Data atau berkas tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
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
    let fileUrl: string | null = null;

    // ─────────────────────────────────────────────────────────
    // TYPE: kk  →  families.kk_file
    // ─────────────────────────────────────────────────────────
    if (type === "kk") {
      const family = await db.query.families.findFirst({
        where: eq(families.id, id),
        columns: { id: true, kkFile: true, headUserId: true },
      });

      if (!family) return NextResponse.json({ error: "Data Kartu Keluarga tidak ditemukan." }, { status: 404 });
      if (!family.kkFile) return NextResponse.json({ error: "Berkas Scan KK belum diunggah." }, { status: 404 });

      const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");
      const isOwner = family.headUserId === session.user.id;

      if (!hasViewPerm && !isOwner) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengakses berkas KK ini." }, { status: 403 });
      }

      fileUrl = family.kkFile;

    // ─────────────────────────────────────────────────────────
    // TYPE: ktp-member  →  family_members.ktp_file
    // ─────────────────────────────────────────────────────────
    } else if (type === "ktp-member") {
      const member = await db.query.familyMembers.findFirst({
        where: eq(familyMembers.id, id),
        columns: { id: true, ktpFile: true, familyId: true },
      });

      if (!member) return NextResponse.json({ error: "Data anggota keluarga tidak ditemukan." }, { status: 404 });
      if (!member.ktpFile) return NextResponse.json({ error: "Berkas Scan KTP belum diunggah." }, { status: 404 });

      const family = await db.query.families.findFirst({
        where: eq(families.id, member.familyId),
        columns: { headUserId: true },
      });

      const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");
      const isOwner = family?.headUserId === session.user.id;

      if (!hasViewPerm && !isOwner) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengakses berkas KTP ini." }, { status: 403 });
      }

      fileUrl = member.ktpFile;

    // ─────────────────────────────────────────────────────────
    // TYPE: ktp-tenant  →  rental_contracts.individual_ktp_file
    // ─────────────────────────────────────────────────────────
    } else if (type === "ktp-tenant") {
      const contract = await db.query.rentalContracts.findFirst({
        where: eq(rentalContracts.id, id),
        columns: { id: true, individualKtpFile: true },
      });

      if (!contract) return NextResponse.json({ error: "Data kontrak sewa tidak ditemukan." }, { status: 404 });
      if (!contract.individualKtpFile) return NextResponse.json({ error: "Berkas Scan KTP penyewa belum diunggah." }, { status: 404 });

      const hasManagePerm = await hasPermission(effectiveRoleId, "manage-boarding");
      const hasViewPerm = await hasPermission(effectiveRoleId, "view-residents");

      if (!hasManagePerm && !hasViewPerm) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengakses berkas KTP penyewa ini." }, { status: 403 });
      }

      fileUrl = contract.individualKtpFile;

    // ─────────────────────────────────────────────────────────
    // TYPE: receipt  →  cash_transactions.receipt_file
    // Transparansi: semua user yang login boleh melihat nota kas RT
    // ─────────────────────────────────────────────────────────
    } else if (type === "receipt") {
      const transaction = await db.query.cashTransactions.findFirst({
        where: eq(cashTransactions.id, id),
        columns: { id: true, receiptFile: true },
      });

      if (!transaction) return NextResponse.json({ error: "Data transaksi tidak ditemukan." }, { status: 404 });
      if (!transaction.receiptFile) return NextResponse.json({ error: "Bukti nota untuk transaksi ini belum diunggah." }, { status: 404 });

      // Semua user yang sudah login boleh lihat nota kas (transparansi keuangan RT)
      fileUrl = transaction.receiptFile;

    } else {
      return NextResponse.json({ error: `Tipe berkas '${type}' tidak dikenali.` }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────
    // Generate Cloudinary Signed URL (berlaku 10 menit)
    // ─────────────────────────────────────────────────────────
    const publicId = extractPublicIdFromUrl(fileUrl, true);
    if (!publicId) {
      return NextResponse.json({ error: "Format URL berkas tidak valid. Harap unggah ulang berkas." }, { status: 422 });
    }

    // PDF di Cloudinary (kk/ktp) disimpan sebagai resource_type 'image' dengan format pdf.
    // Deteksi tipe delivery ('authenticated', 'upload', atau 'private') berdasarkan URL tersimpan
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
