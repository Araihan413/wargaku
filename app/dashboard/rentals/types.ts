export type TenantType = "perorangan" | "keluarga";
export type RoomStatus = "vacant" | "occupied" | "sharing";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface ActiveTenantInfo {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType: TenantType;
  roomNumber?: string | null;
  checkInDate: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string | null;
  hasActivated?: boolean;
  ktpFile?: string | null;
  originAddress?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: string | null;
  isActive: boolean;
}

export interface RoomGridItem {
  roomNumber: string;
  status: RoomStatus;
  residentsCount: number;
  residents: ActiveTenantInfo[];
}

export interface PropertyDetail {
  id: number;
  name: string;
  dwellingId: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
  qrToken?: string | null;
  totalRooms: number;
  contactPerson?: string | null;
  phone?: string | null;
  notes?: string | null;
  coordinatorUserId?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  isOwnerView?: boolean;
}

export interface RoomHistoryItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType: TenantType;
  checkInDate: string;
  checkOutDate?: string | null;
  checkOutNote?: string | null;
  verificationStatus: VerificationStatus;
  notes?: string | null;
  createdAt: string;
}
