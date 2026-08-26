import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { setInitialRegistrationRole } from "@/db/queries/auth/user.queries";
import { notifyRoles } from "@/lib/notifications";
import { sendEmail } from "@/lib/mail";
import {
  getKoordinatorRegistrationEmail,
} from "@/lib/emails/templates";



/**
 * @openapi
 * /api/auth/assign-role:
 *   post:
 *     summary: Menetapkan role akun saat pendaftaran (Koordinator Kos / Warga)
 *     description: Endpoint untuk menetapkan roleId yang sesuai (5 untuk Koordinator Kos, 6 untuk Warga) pada akun yang baru didaftarkan (berstatus pending) sebelum sesi diakhiri. Endpoint ini juga memicu pengiriman notifikasi internal ke Ketua RT & Sekretaris serta email konfirmasi pendaftaran ke pengguna.
 *     tags:
 *       - Autentikasi
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 enum: [5, 6]
 *                 description: ID Role pengguna (5 = Koordinator Kos, 6 = Warga)
 *     responses:
 *       200:
 *         description: Role pengguna berhasil ditetapkan dan notifikasi terkirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roleId:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: roleId tidak valid (hanya 5 atau 6 yang diizinkan)
 *       401:
 *         description: Belum terautentikasi (memerlukan sesi pengguna aktif)
 *       403:
 *         description: Akses ditolak (hanya dapat diakses oleh pengguna berstatus pending)
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hanya izinkan user yang berstatus pending (baru saja mendaftar)
    const userStatus = (session.user as any).status;
    if (userStatus !== "pending") {
      return NextResponse.json(
        { error: "Hanya user berstatus pending yang dapat menggunakan endpoint ini" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roleId } = body;

    // Validasi roleId — hanya izinkan 5 (Koordinator) atau 6 (Warga)
    if (typeof roleId !== "number" || ![5, 6].includes(roleId)) {
      return NextResponse.json(
        { error: "roleId tidak valid. Hanya nilai 5 (Koordinator) atau 6 (Warga) yang diizinkan." },
        { status: 400 }
      );
    }

    // Update user_roles dengan roleId yang benar secara eksklusif
    await setInitialRegistrationRole(session.user.id, roleId);


    // Kirim notifikasi ke RT & email konfirmasi sesuai tipe akun
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "http://localhost:3000";
    const loginLink = `${appUrl}/login`;
    const userName = session.user.name;
    const userEmail = session.user.email;

    if (roleId === 5) {
      // Koordinator Kos Mandiri
      try {
        await notifyRoles(["ketua-rt", "sekretaris"], {
          title: "Pendaftaran Koordinator Kos Baru",
          message: `Koordinator Kos bernama ${userName} telah mendaftar secara mandiri dan menunggu persetujuan Anda.`,
          category: "dinas",
          redirectLink: `/dashboard/approvals/registration`,
        });
      } catch (err) {
        console.error("Gagal kirim notifikasi RT untuk koordinator:", err);
      }

      try {
        await sendEmail({
          to: { email: userEmail, name: userName },
          subject: "Pendaftaran Koordinator Kos Wargaku Berhasil",
          htmlContent: getKoordinatorRegistrationEmail(userName, loginLink),
        });
      } catch (err) {
        console.error("Gagal kirim email konfirmasi koordinator:", err);
      }
    } else {
      // Warga (KK) Mandiri — notifikasi RT (email sudah dikirim di databaseHook)
      try {
        await notifyRoles(["ketua-rt", "sekretaris"], {
          title: "Pendaftaran Warga Baru",
          message: `Warga bernama ${userName} telah mendaftar dan menunggu persetujuan Anda.`,
          category: "dinas",
          redirectLink: `/dashboard/approvals/registration`,
        });
      } catch (err) {
        console.error("Gagal kirim notifikasi RT untuk warga:", err);
      }
    }

    // Cek apakah email warga perlu dikirim ulang (jika databaseHook gagal)
    // Untuk warga, email konfirmasi sudah dikirim di databaseHook auth.ts
    // Untuk koordinator, email dikirim di sini karena tipe baru diketahui sekarang

    return NextResponse.json({ success: true, roleId });
  } catch (error: any) {
    console.error("Error in POST /api/auth/assign-role:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
