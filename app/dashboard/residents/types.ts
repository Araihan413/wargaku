export interface FamilyItem {
  id: number;
  familyNumber: string;
  headUserId: string;
  headName: string;
  dwellingId: number;
  unitNumber?: string | null;
  kkFile?: string | null;
  verificationStatus: "draft" | "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  isActive: boolean;
  
  // Joined from dwellings
  blockNumber?: string;
  houseNumber?: string;
  dwellingType?: string;
  
  // Aggregated
  memberCount: number;
}

export interface FamilyMemberItem {
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
  isKtpSameVillage?: boolean;
  ktpAddress?: string | null;
  isActive: boolean;
  inactiveNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyDetail {
  id: number;
  dwellingId: number;
  familyNumber: string;
  headUserId: string;
  headName: string;
  unitNumber?: string | null;
  kkFile?: string | null;
  verificationStatus: "draft" | "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  isActive: boolean;
  
  // Dwelling info
  dwelling: {
    id: number;
    blockNumber?: string | null;
    houseNumber?: string | null;
    type: "permanen" | "kos" | "homestay";
    ownerName?: string | null;
    ownerPhone?: string | null;
  };
  
  members: FamilyMemberItem[];
}

export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
}

export interface DwellingOption {
  id: number;
  blockNumber?: string | null;
  houseNumber?: string | null;
  type: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
  nik?: string | null;
}
