import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { setupMyFamilyCard } from "@/db/queries/population/family.queries";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const body = await req.json();
    const { dwellingId, familyNumber, nik, kkFile } = body;

    if (!dwellingId || !familyNumber) {
      return NextResponse.json(
        { error: "Hunian dan Nomor KK wajib diisi." },
        { status: 400 }
      );
    }

    const familyId = await setupMyFamilyCard(session.user.id, {
      dwellingId: Number(dwellingId),
      familyNumber: String(familyNumber).trim(),
      nik: nik ? String(nik).trim() : null,
      kkFile: kkFile || null,
    });

    return NextResponse.json({
      message: "Kartu Keluarga berhasil didaftarkan!",
      familyId,
    });
  } catch (error: any) {
    console.error("Error in POST /api/families/my-setup:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mendaftarkan Kartu Keluarga" },
      { status: 400 }
    );
  }
}
