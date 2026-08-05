export interface ActivityItem {
  id: number;
  title: string;
  description?: string | null;
  eventDate: string;
  location?: string | null;
  attachments?: string | null;
  isPinned: boolean;
  createdBy: string;
  creatorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFormData {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  attachments?: string;
  isPinned: boolean;
}
