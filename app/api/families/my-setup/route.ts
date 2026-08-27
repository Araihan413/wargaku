import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { setupMyFamilyCard } from "@/db/queries/population/family.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { setupMyFamilySchema } from "@/lib/validations/kependudukan";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await req.json();
    const validated = setupMyFamilySchema.parse(body);

    const familyId = await setupMyFamilyCard(session.user.id, {
      dwellingId: validated.dwellingId,
      familyNumber: validated.familyNumber,
      nik: validated.nik || null,
      kkFile: validated.kkFile || null,
    });

    const ipAddress = await getClientIp(req);
    createAuditLog({
      userId: session.user.id,
      action: "SETUP_FAMILY_CARD",
      module: "kependudukan",
      description: `${session.user.name} mendaftarkan Kartu Keluarga mandiri (No. KK: ${validated.familyNumber}, hunian ID: ${validated.dwellingId}).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      message: "Kartu Keluarga berhasil didaftarkan!",
      familyId,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in POST /api/families/my-setup:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mendaftarkan Kartu Keluarga" },
      { status: 400 }
    );
  }
}

