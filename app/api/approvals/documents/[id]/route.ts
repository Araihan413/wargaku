import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { updateFamily, getFamilyById } from "@/db/queries/kependudukan";
import { updateRentalResident, getRentalResidentById } from "@/db/queries/rental";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "verify-documents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = Number(id);

    if (isNaN(documentId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { type, action, rejectReason } = body;

    if (!type || (type !== "family" && type !== "rental_resident")) {
      return NextResponse.json({ error: "Tipe dokumen tidak valid (harus family atau rental_resident)" }, { status: 400 });
    }

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Aksi tidak valid (harus approve atau reject)" }, { status: 400 });
    }

    const status = action === "approve" ? "verified" : "rejected";
    const note = action === "reject" ? rejectReason || "Dokumen tidak sesuai / tidak valid." : null;

    if (action === "reject" && !rejectReason?.trim()) {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    }

    if (type === "family") {
      const family = await getFamilyById(documentId);
      if (!family) {
        return NextResponse.json({ error: "Kartu Keluarga tidak ditemukan" }, { status: 404 });
      }

      await updateFamily(documentId, {
        verificationStatus: status,
        verificationNote: note,
      });

      return NextResponse.json({
        success: true,
        message: action === "approve" 
          ? "Berkas Kartu Keluarga berhasil diverifikasi & disetujui" 
          : "Berkas Kartu Keluarga ditolak",
      });
    } else {
      // type === "rental_resident"
      const resident = await getRentalResidentById(documentId);
      if (!resident) {
        return NextResponse.json({ error: "Penghuni sewa tidak ditemukan" }, { status: 404 });
      }

      await updateRentalResident(documentId, {
        verificationStatus: status,
        verificationNote: note,
        updatedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        message: action === "approve" 
          ? "Berkas KTP Penghuni berhasil diverifikasi & disetujui" 
          : "Berkas KTP Penghuni ditolak",
      });
    }
  } catch (error: any) {
    console.error("Error in PATCH /api/approvals/documents/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
