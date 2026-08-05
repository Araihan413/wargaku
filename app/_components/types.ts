import { SystemSettingsData } from "@/app/dashboard/system-config/types";
import {
  PublicAnnouncementItem,
  PublicActivityItem,
  PublicDemographicsData,
  PublicFinanceSummary,
  EmergencyContactItem,
} from "@/db/queries/dashboard/public-portal.queries";

export interface PublicPortalData {
  settings: SystemSettingsData;
  announcements: PublicAnnouncementItem[];
  activities: PublicActivityItem[];
  demographics: PublicDemographicsData;
  financeSummary: PublicFinanceSummary;
  emergencyContacts: EmergencyContactItem[];
}
