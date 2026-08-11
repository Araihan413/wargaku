export interface BroadcastAdminItem {
  id: number;
  title: string;
  message: string;
  type: "info" | "maintenance" | "feature" | "warning";
  sendPush: boolean;
  sendInAppNotif: boolean;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  authorName: string | null;
}

export interface CreateBroadcastPayload {
  title: string;
  message: string;
  type: "info" | "maintenance" | "feature" | "warning";
  sendPush: boolean;
  sendInAppNotif: boolean;
  expiresAt: string | null;
}
