export interface CoordinatorSummary {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  pendingVerifications: number;
  totalActiveResidents: number;
}

export interface PropertyOccupancyItem {
  id: number;
  name: string;
  address: string;
  type: string;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
}

export interface PendingRenterItem {
  id: number;
  name: string;
  nik: string;
  tenantType: "perorangan" | "keluarga";
  roomNumber?: string | null;
  checkInDate: string;
  verificationStatus: "pending" | "verified" | "rejected";
  ktpFile?: string | null;
  propertyName: string;
}

export interface CoordinatorDashboardStats {
  summary: CoordinatorSummary;
  propertyBreakdown: PropertyOccupancyItem[];
  pendingQueue: PendingRenterItem[];
}
