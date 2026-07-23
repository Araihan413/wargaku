export type VerificationStatusType = "draft" | "pending" | "verified" | "rejected" | "unsubmitted";

export interface WargaFamilyMember {
  id: number;
  familyId: number;
  name: string;
  nik: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender: "L" | "P";
  relationship: "Kepala_Keluarga" | "Suami" | "Istri" | "Anak" | "Orang_Tua" | "Lainnya";
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu" | "Lainnya" | null;
  phone?: string | null;
  ktpFile?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WargaFamilyDetail {
  id: number;
  dwellingId: number;
  familyNumber: string;
  headUserId: string;
  headName: string;
  unitNumber?: string | null;
  kkFile?: string | null;
  verificationStatus: VerificationStatusType;
  verificationNote?: string | null;
  hasVerified: boolean;
  draftOpenedAt?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  isActive: boolean;
  updatedAt: string;
  dwellingAddress?: {
    blockNumber: string;
    houseNumber: string;
    type: string;
  } | null;
  members: WargaFamilyMember[];
}
