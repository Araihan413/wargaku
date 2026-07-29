import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemSettings, updateSystemSettings } from "@/db/queries/system-settings";
import type { UpdateSystemSettingsInput } from "@/db/queries/system-settings";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Error in GET /api/system-config:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const body = await req.json() as UpdateSystemSettingsInput;

    // Validasi field wajib
    if (!body.rtName?.trim()) {
      return NextResponse.json({ error: "Nama RT wajib diisi" }, { status: 400 });
    }
    if (!body.rwName?.trim()) {
      return NextResponse.json({ error: "Nama RW wajib diisi" }, { status: 400 });
    }
    if (!body.villageName?.trim()) {
      return NextResponse.json({ error: "Nama Kelurahan/Desa wajib diisi" }, { status: 400 });
    }
    if (!body.subdistrict?.trim()) {
      return NextResponse.json({ error: "Nama Kecamatan wajib diisi" }, { status: 400 });
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ error: "Kota/Kabupaten wajib diisi" }, { status: 400 });
    }

    // Ambil IP dari header request
    const reqHeaders = await headers();
    const ipAddress =
      reqHeaders.get("x-forwarded-for") ||
      reqHeaders.get("x-real-ip") ||
      "127.0.0.1";

    const updatedSettings = await updateSystemSettings(body, session.user.id, ipAddress);

    return NextResponse.json({
      settings: updatedSettings,
      message: "Konfigurasi sistem berhasil disimpan",
    });
  } catch (error: any) {
    console.error("Error in PUT /api/system-config:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
