import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SystemSettingsData {
  id: number;
  rtName: string;
  rwName: string;
  villageName: string;
  subdistrict: string;
  city: string;
  secretariatAddress: string | null;
  logoPath: string | null;
  officialEmail: string | null;
  officialRtPhone: string | null;
  officialSecretaryPhone: string | null;
  officialTreasurerPhone: string | null;
  updatedAt: string;
}

export interface UpdateSystemSettingsInput {
  rtName: string;
  rwName: string;
  villageName: string;
  subdistrict: string;
  city: string;
  secretariatAddress?: string | null;
  logoPath?: string | null;
  officialEmail?: string | null;
  officialRtPhone?: string | null;
  officialSecretaryPhone?: string | null;
  officialTreasurerPhone?: string | null;
}

const DEFAULT_SETTINGS = {
  id: 1,
  rtName: "RT 01",
  rwName: "RW 01",
  villageName: "Nama Kelurahan",
  subdistrict: "Nama Kecamatan",
  city: "Nama Kota",
};

/**
 * Mengambil konfigurasi sistem global (id = 1).
 * Jika belum ada, secara otomatis membuat record default.
 */
export async function getSystemSettings(): Promise<SystemSettingsData> {
  const [existing] = await db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1));

  if (existing) {
    return {
      ...existing,
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  // Auto-initialize default record
  await db.insert(schema.systemSettings).values(DEFAULT_SETTINGS);

  const [created] = await db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1));

  return {
    ...created,
    updatedAt: created.updatedAt.toISOString(),
  };
}

/**
 * Memperbarui konfigurasi sistem dan mencatat audit trail.
 */
export async function updateSystemSettings(
  input: UpdateSystemSettingsInput,
  actorUserId: string,
  ipAddress?: string | null
): Promise<SystemSettingsData> {
  const now = new Date();

  await db
    .update(schema.systemSettings)
    .set({
      rtName: input.rtName.trim(),
      rwName: input.rwName.trim(),
      villageName: input.villageName.trim(),
      subdistrict: input.subdistrict.trim(),
      city: input.city.trim(),
      secretariatAddress: input.secretariatAddress?.trim() || null,
      logoPath: input.logoPath || null,
      officialEmail: input.officialEmail?.trim() || null,
      officialRtPhone: input.officialRtPhone?.trim() || null,
      officialSecretaryPhone: input.officialSecretaryPhone?.trim() || null,
      officialTreasurerPhone: input.officialTreasurerPhone?.trim() || null,
      updatedAt: now,
    })
    .where(eq(schema.systemSettings.id, 1));

  // Catat Audit Trail Keamanan
  await db.insert(schema.activityLogs).values({
    userId: actorUserId,
    action: "UPDATE_SYSTEM_SETTINGS",
    module: "sistem",
    description: `Konfigurasi sistem diperbarui: RT ${input.rtName.trim()} / RW ${input.rwName.trim()}, Kelurahan ${input.villageName.trim()}, ${input.city.trim()}`,
    ipAddress: ipAddress || null,
    createdAt: now,
  });

  return getSystemSettings();
}
