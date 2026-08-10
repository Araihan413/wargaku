import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { rentalContracts, rentalProperties, accountActivationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createActivationTokenAndSendEmail } from "@/db/queries/property/tenant.queries";

/**
 * @openapi
 * /api/rentals/resend-invitation:
 *   post:
 *     summary: Kirim Ulang Email Undangan (Keluarga)
 *     description: Mengirim ulang email undangan untuk aktivasi akun pengguna kepada penyewa tipe keluarga.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractId
 *             properties:
 *               contractId:
 *                 type: integer
 *               email:
 *                 type: string
 *                 description: Email tujuan jika ingin di-override
 *     responses:
 *       200:
 *         description: Email undangan berhasil dikirim ulang
 *       400:
 *         description: ID Kontrak tidak valid atau email kosong
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Kontrak sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, email: overrideEmail } = body;

    if (!contractId || isNaN(Number(contractId))) {
      return NextResponse.json({ error: "ID Kontrak Sewa tidak valid." }, { status: 400 });
    }

    // Fetch contract details
    const [contract] = await db
      .select({
        id: rentalContracts.id,
        individualName: rentalContracts.individualName,
        individualNik: rentalContracts.individualNik,
        individualPhone: rentalContracts.individualPhone,
        roomNumber: rentalContracts.roomNumber,
        propertyName: rentalProperties.name,
      })
      .from(rentalContracts)
      .innerJoin(rentalProperties, eq(rentalContracts.rentalPropertyId, rentalProperties.id))
      .where(eq(rentalContracts.id, Number(contractId)))
      .limit(1);

    if (!contract) {
      return NextResponse.json({ error: "Kontrak sewa tidak ditemukan." }, { status: 404 });
    }

    // Determine target email
    let targetEmail = overrideEmail;
    if (!targetEmail) {
      // Find latest token for this contract to get original email
      const [latestToken] = await db
        .select({ email: accountActivationTokens.email })
        .from(accountActivationTokens)
        .where(eq(accountActivationTokens.rentalContractId, contract.id))
        .orderBy(accountActivationTokens.createdAt)
        .limit(1);

      if (latestToken) {
        targetEmail = latestToken.email;
      }
    }

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Email penyewa belum diinput. Harap masukkan email penerima." },
        { status: 400 }
      );
    }

    const reqOrigin = request.headers.get("origin") || undefined;

    const { activationUrl } = await createActivationTokenAndSendEmail({
      email: targetEmail,
      nik: contract.individualNik || "",
      rentalContractId: contract.id,
      propertyName: contract.propertyName,
      roomNumber: contract.roomNumber,
      userName: contract.individualName || "Penyewa",
      requestOrigin: reqOrigin,
    });

    return NextResponse.json({
      success: true,
      message: `Email undangan berhasil dikirim ulang ke ${targetEmail}.`,
      activationUrl,
    });
  } catch (error: any) {
    console.error("Error in POST /api/rentals/resend-invitation:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengirim ulang email undangan." },
      { status: 500 }
    );
  }
}
