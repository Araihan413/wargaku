import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getContractDetailsForInvitationResend,
  createActivationTokenAndSendEmail,
} from "@/db/queries/property/tenant.queries";
import { resendInvitationSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const validated = resendInvitationSchema.parse(body);
    const contractId = validated.contractId;
    const overrideEmail = body.email;

    const { contract, defaultEmail } = await getContractDetailsForInvitationResend(contractId);

    if (!contract) {
      return NextResponse.json({ error: "Kontrak sewa tidak ditemukan." }, { status: 404 });
    }

    const targetEmail = overrideEmail || defaultEmail;

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
      userName: contract.individualName || "Penyewa",
      requestOrigin: reqOrigin,
    });

    return NextResponse.json({
      success: true,
      message: `Email undangan berhasil dikirim ulang ke ${targetEmail}.`,
      activationUrl,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error("Error in POST /api/rentals/resend-invitation:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengirim ulang email undangan." },
      { status: 500 }
    );
  }
}

