export interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  tenantType?: "perorangan" | "keluarga";
  roomNumber?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  verificationStatus: "draft" | "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  isActive: boolean;
  propertyName?: string;
  blockNumber?: string;
  houseNumber?: string;
  gender?: "L" | "P" | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  ktpFile?: string | null;
}

export interface PropertyDetails {
  id: number;
  dwellingId: number;
  name: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms: number;
  isActive: boolean;
  activeResidentsCount: number;
  dwelling: {
    id: number;
    blockNumber: string;
    houseNumber: string;
    qrToken: string;
    type: string;
  };
  coordinator?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: string;
  } | null;
  notes?: string | null;
  maxActiveRoomNumber?: number;
}
