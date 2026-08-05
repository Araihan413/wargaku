export type ImageFormat = "image/webp" | "image/jpeg" | "image/png";

export interface FileValidationOptions {
  /** Daftar MIME types yang diizinkan, contoh: ['image/jpeg', 'image/png', 'application/pdf'] */
  allowedTypes: string[];
  /** Ukuran maksimum file dalam Megabytes (MB) */
  maxSizeMB: number;
  /** Format target konversi untuk gambar. Jika undefined/null, format asli dipertahankan */
  targetFormat?: ImageFormat;
  /** Kualitas kompresi canvas (0.1 - 1.0), default: 0.8 */
  quality?: number;
  /** Dimensi maksimum panjang/lebar gambar (px) untuk resize (aspect ratio tetap dijaga!) */
  maxWidthOrHeight?: number;
  /** Jika true, gambar yang diupload untuk dokumen ini akan otomatis dikonversi ke file PDF */
  convertToPdf?: boolean;
}

export interface ProcessedFileResult {
  /** File asli atau file yang telah dioptimasi/dikonversi */
  file: File;
  /** File size setelah diproses (bytes) */
  size: number;
  /** Tipe MIME setelah diproses */
  type: string;
  /** Apakah file mengalami kompresi / konversi */
  isOptimized: boolean;
  /** URL Object sementara untuk live preview di UI */
  previewUrl: string;
}
