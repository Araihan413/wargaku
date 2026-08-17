import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createAuditLog } from './audit-log.queries';

export interface SystemEmergencyContactItem {
  id?: string;
  name: string;
  phone: string;
  subtitle?: string;
}

export interface UpdateSystemSettingsInput {
  rtName?: string;
  rwName?: string;
  villageName?: string;
  subdistrict?: string;
  city?: string;
  logoPath?: string | null;
  officialEmail?: string | null;
  officialRtPhone?: string | null;
  officialSecretaryPhone?: string | null;
  officialTreasurerPhone?: string | null;
  emergencyContacts?: SystemEmergencyContactItem[] | null;
  latitude?: string | null;
  longitude?: string | null;
  secretariatAddress?: string | null;
}

export async function getSystemSettings() {
  const [settings] = await db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1))
    .limit(1);

  if (!settings) {
    // Default fallback
    return {
      id: 1,
      rtName: '001',
      rwName: '005',
      villageName: 'Argorejo',
      subdistrict: 'Sedayu',
      city: 'Kabupaten Bantul',
      logoPath: null,
      officialEmail: 'rt001@example.com',
      officialRtPhone: '08123456789',
      officialSecretaryPhone: '08123456788',
      officialTreasurerPhone: '08123456787',
      emergencyContacts: [],
      latitude: null,
      longitude: null,
      secretariatAddress: 'Dusun Polaman, Kepuhan',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return settings;
}

export async function updateSystemSettings(data: UpdateSystemSettingsInput, userId?: string, ipAddress?: string) {
  await db
    .update(schema.systemSettings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.systemSettings.id, 1));

  if (userId) {
    const updatedFields: string[] = [];
    if (data.rtName || data.rwName || data.villageName) updatedFields.push('Identitas Wilayah');
    if (data.logoPath !== undefined) updatedFields.push('Logo Branding');
    if (data.officialEmail || data.officialRtPhone) updatedFields.push('Kontak Official');
    if (data.emergencyContacts !== undefined) updatedFields.push('Kontak Darurat');

    const detailText = updatedFields.length > 0 ? updatedFields.join(', ') : 'Identitas Wilayah & Sistem';

    await createAuditLog({
      userId,
      action: 'UPDATE_SYSTEM_SETTINGS',
      module: 'sistem',
      description: `Memperbarui konfigurasi sistem RT (${detailText})`,
      ipAddress: ipAddress || null,
    });
  }

  return getSystemSettings();
}
