import { SelectOption } from "@/components/CustomSelect";

export const commonOccupations = [
  "Belum/Tidak Bekerja",
  "Mengurus Rumah Tangga",
  "Pelajar/Mahasiswa",
  "Pensiunan",
  "PNS",
  "TNI",
  "Polri",
  "Karyawan Swasta",
  "Karyawan BUMN",
  "Karyawan BUMD",
  "Buruh Harian Lepas",
  "Petani/Pekebun",
  "Nelayan",
  "Pedagang",
  "Wiraswasta",
];

export const commonEducations = [
  "Tidak/Belum Sekolah",
  "SD / Sederajat",
  "SMP / Sederajat",
  "SMA / SMK / Sederajat",
  "Diploma I / II",
  "Akademi / Diploma III (D3)",
  "Diploma IV / Sarjana (S1)",
  "Magister (S2)",
  "Doktor (S3)",
];

export const religionOptions: SelectOption[] = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" },
  { value: "Lainnya", label: "Lainnya" },
];

export const relationshipOptions: SelectOption[] = [
  { value: "Kepala_Keluarga", label: "Kepala Keluarga" },
  { value: "Istri", label: "Istri" },
  { value: "Suami", label: "Suami" },
  { value: "Anak", label: "Anak" },
  { value: "Orang_Tua", label: "Orang Tua" },
  { value: "Mertua", label: "Mertua" },
  { value: "Sepupu", label: "Sepupu" },
  { value: "Lainnya", label: "Lainnya" },
];

export const genderOptions: SelectOption[] = [
  { value: "P", label: "Perempuan" },
  { value: "L", label: "Laki-laki" },
];

export const tenantTypeOptions: SelectOption[] = [
  { value: "perorangan", label: "Perorangan (Individu)" },
  { value: "keluarga", label: "Keluarga (Satu KK)" },
];
