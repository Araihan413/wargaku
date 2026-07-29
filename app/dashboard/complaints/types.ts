export type ComplaintStatus = 'menunggu' | 'proses' | 'selesai' | 'ditolak';

export type ComplaintCategory =
  | 'Infrastruktur'
  | 'Kebersihan'
  | 'Keamanan'
  | 'Sosial'
  | 'Lainnya';

export interface ComplaintItem {
  id: number;
  trackingCode: string;
  reporterName: string;
  reporterPhone: string | null;
  category: ComplaintCategory;
  description: string;
  photoPath: string | null;
  dwellingId: number | null;
  dwellingAddress: string | null;
  status: ComplaintStatus;
  responseNote: string | null;
  handledBy: string | null;
  handlerName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ComplaintKpiSummary {
  total: number;
  menunggu: number;
  proses: number;
  selesai: number;
  ditolak: number;
}

export interface ComplaintFilterState {
  status: string;
  category: string;
  search: string;
}
