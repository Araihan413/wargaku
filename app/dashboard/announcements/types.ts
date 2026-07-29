export type AnnouncementCategory = "umum" | "penting" | "mendesak";

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  pinUntil?: string | null;
  createdBy: string;
  creatorName?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
}
