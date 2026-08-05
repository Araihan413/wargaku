export type ProfileTabType = "data-diri" | "keamanan" | "kependudukan";

export interface DwellingInfo {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
}

export interface FamilyInfo {
  id: number;
  familyNumber: string;
  headName: string;
}

export interface ResidentInfo {
  id: number;
  familyId: number;
  relationship: string;
  name: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  nik: string | null;
  phone: string | null;
  photo: string | null;
  roleId: number;
  roleName: string | null;
  roleSlug: string | null;
  status: "pending" | "active" | "suspended";
  familyNumber: string | null;
  unitNumber: string | null;
  dwellingId: number | null;
  createdAt: string | Date;
  dwellingInfo?: DwellingInfo | null;
  familyInfo?: FamilyInfo | null;
  residentInfo?: ResidentInfo | null;
}

