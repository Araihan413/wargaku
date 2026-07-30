export interface EmergencyContactItem {
  id?: string;
  name: string;
  phone: string;
  subtitle?: string;
}

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
  emergencyContacts?: EmergencyContactItem[] | null;
  latitude?: string | null;
  longitude?: string | null;
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
  emergencyContacts?: EmergencyContactItem[] | null;
  latitude?: string | null;
  longitude?: string | null;
}

// alias for UI usage
export type SystemConfigFormState = UpdateSystemSettingsInput;
