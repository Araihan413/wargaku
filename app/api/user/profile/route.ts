import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserFullProfile, updateUserProfileData } from "@/db/queries/auth/user.queries";
import { uploadAndExecuteWithRollback } from "@/lib/file-processor/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Tidak tersertifikasi" }, { status: 401 });
    }

    const profile = await getUserFullProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Gagal mengambil data profil" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Tidak tersertifikasi" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const phone = formData.get("phone") as string | null;
    const imageFile = formData.get("image") as File | null;

    const payload: { name?: string; phone?: string; image?: string } = {};
    if (name) payload.name = name.trim();
    if (phone !== null) payload.phone = phone.trim();

    const currentProfile = await getUserFullProfile(session.user.id);

    let updatedProfile;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran foto profil maksimal 2 MB" },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Transaksi Atomic: Upload + Simpan DB + Rollback jika Gagal + Hapus foto lama jika Sukses
      updatedProfile = await uploadAndExecuteWithRollback({
        fileBuffer: buffer,
        folder: "avatars",
        fileName: `avatar_${session.user.id}_${Date.now()}`,
        oldFileUrl: currentProfile?.image,
        dbOperation: async ({ url }) => {
          payload.image = url;
          return await updateUserProfileData(session.user.id, payload);
        },
      });
    } else {
      updatedProfile = await updateUserProfileData(session.user.id, payload);
    }

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
