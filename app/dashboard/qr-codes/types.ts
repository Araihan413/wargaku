import { SystemSettingsData } from "../system-config/types";
import { DwellingOption } from "@/db/queries/qr-codes";
import { QrTemplateType } from "@/components/QrCodePrintCanvas";

export type QrPresetType = "rt_public" | "dwelling_sticker" | "rental_property" | "custom_url";

export interface QrConfigState {
  preset: QrPresetType;
  selectedDwellingId: number | null;
  customUrl: string;
  title: string;
  subtitle: string;
  template: QrTemplateType;
  showContacts: boolean;
  showLogo: boolean;
}

export interface QrPageData {
  systemSettings: SystemSettingsData;
  dwellings: DwellingOption[];
}
