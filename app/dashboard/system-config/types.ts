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


// alias for UI usage
export type SystemConfigFormState = UpdateSystemSettingsInput;

