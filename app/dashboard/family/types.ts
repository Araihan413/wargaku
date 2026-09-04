export type VerificationStatusType = "draft" | "pending" | "verified" | "rejected";

export interface WargaFamilyMember {
  id: number;
  familyId: number;
  name: string;
  nik: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender: "L" | "P";
  relationship: "Kepala_Keluarga" | "Suami" | "Istri" | "Anak" | "Orang_Tua" | "Mertua" | "Sepupu" | "Lainnya";
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu" | "Lainnya" | null;
  phone?: string | null;
  ktpFile?: string | null;
  isKtpSameVillage?: boolean;
  ktpAddress?: string | null;
  inactiveNote?: string | null;
  isActive: boolean;
  _action?: "keep" | "create" | "update" | "delete";
  tempId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WargaChangeRequest {
  id: number;
  familyId: number;
  headUserId: string;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  rejectionNote: string | null;
  familyNumber: string | null;
  kkFile: string | null;
  draftData: {
    familyNumber: string;
    kkFile?: string | null;
    members: WargaFamilyMember[];
  };
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WargaFamilyDetail {
  id: number;
  dwellingId: number;
  familyNumber: string;
  headUserId: string;
  headName: string;
  kkFile?: string | null;
  verificationStatus: VerificationStatusType;
  verificationNote?: string | null;
  hasVerified?: boolean;
  checkInDate: string;
  checkOutDate?: string | null;
  isActive: boolean;
  updatedAt: string;
  dwellingAddress?: {
    blockNumber: string;
    houseNumber: string;
    type: string;
  } | null;
  dwelling?: {
    id: number;
    blockNumber: string;
    houseNumber: string;
    type: string;
  } | null;
  isRentalFamily?: boolean;
  members: WargaFamilyMember[];
  changeRequest?: WargaChangeRequest | null;
}

