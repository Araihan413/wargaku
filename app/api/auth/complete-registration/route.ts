import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { completeWargaRegistration } from "@/db/queries/auth/user.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { notifyRoles } from "@/lib/notifications";
import { sendEmail } from "@/lib/mail";
import { getWargaRegistrationEmail } from "@/lib/emails/templates";
import { completeRegistrationSchema } from "@/lib/validations/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = completeRegistrationSchema.parse(body);

    try {
      await completeWargaRegistration(session.user.id, session.user.name, {
        nik: validated.nik,
        familyNumber: validated.familyNumber,
        dwellingId: validated.dwellingId,
      });
    } catch (err: any) {
      if (err.message === "KK_EXISTS") {
        return NextResponse.json({ error: "Nomor Kartu Keluarga sudah terdaftar" }, { status: 400 });
      }
      if (err.message === "NIK_EXISTS") {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
      }
      throw err;
    }


    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: "COMPLETE_REGISTRATION",
      module: "autentikasi",
      description: `${session.user.name} menyelesaikan pendaftaran data kependudukan (KK No. ${validated.familyNumber}, hunian ID: ${validated.dwellingId}).`,
      ipAddress,
    }).catch(() => null);


    // 1. Kirim notifikasi internal ke Ketua RT & Sekretaris
    notifyRoles(["ketua-rt", "sekretaris"], {
      title: "Pendaftaran Warga Baru",
      message: `Warga bernama ${session.user.name} telah menyelesaikan pendaftaran mandiri dan menunggu persetujuan Anda.`,
      category: "dinas",
      redirectLink: `/dashboard/approvals/registration`,
    }).catch((err) => {
      console.error("Gagal mengirim notifikasi ke RT:", err);
    });

    // 2. Kirim email konfirmasi ke Warga
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const loginLink = `${appUrl}/login`;

    sendEmail({
      to: { email: session.user.email, name: session.user.name },
      subject: "Pendaftaran Akun Wargaku Berhasil",
      htmlContent: getWargaRegistrationEmail(session.user.name, loginLink),
    }).catch((err) => {
      console.error("Gagal mengirim email konfirmasi warga:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in complete-registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

