export interface RentalResidentItem {
  id: number;
  name: string;
  nik: string;
  phone?: string | null;
  roomNumber?: string | null;
  checkInDate: string;
  checkOutDate?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNote?: string | null;
  isActive: boolean;
  notes?: string | null;
  inactiveReason?: "pindah" | "meninggal" | null;
  originAddress?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
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
  roomPattern?: string | null;
  roomList?: string[] | null;
}
