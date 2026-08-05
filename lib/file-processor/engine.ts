import { jsPDF } from "jspdf";
import { FileValidationOptions, ProcessedFileResult, ImageFormat } from "./types";

/**
 * Validasi tipe & ukuran file
 */
export function validateFile(
  file: File,
  options: FileValidationOptions
): { valid: boolean; error?: string } {
  // 1. Validasi Ukuran File
  const maxSizeBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Ukuran berkas (${fileSizeMB} MB) melebihi batas maksimal ${options.maxSizeMB} MB.`,
    };
  }

  // 2. Validasi Tipe File (MIME Type)
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some((allowed) => {
      if (allowed === file.type) return true;
      // Fallback perbandingan ekstensi jika file.type bermasalah di OS tertentu
      if (allowed.startsWith("image/") && file.type.startsWith("image/")) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) return true;
      }
      return false;
    });

    if (!isAllowed) {
      const readableFormats = options.allowedTypes
        .map((t) => t.replace("image/", "").replace("application/", "").toUpperCase())
        .join(", ");
      return {
        valid: false,
        error: `Format berkas tidak didukung. Harap gunakan format: ${readableFormats}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Mengompresi dan mengubah ukuran (resize) gambar via Canvas API.
 * ⚠️ PROPORSI/ASPECT RATIO GAMBAR DIJAMIN TETAP TERJAGA SAMA DENGAN ASLINYA.
 */
export async function compressAndResizeImage(
  file: File,
  options: {
    targetFormat?: ImageFormat;
    quality?: number;
    maxWidthOrHeight?: number;
  }
): Promise<File> {
  // Jika bukan file gambar, lewati proses canvas
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const { targetFormat = "image/webp", quality = 0.8, maxWidthOrHeight = 1920 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;
      const aspectRatio = width / height;

      // Fitur Resize dengan Menjaga Aspect Ratio / Proporsi Asli Gambar
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width >= height) {
          width = maxWidthOrHeight;
          height = Math.round(maxWidthOrHeight / aspectRatio);
        } else {
          height = maxWidthOrHeight;
          width = Math.round(maxWidthOrHeight * aspectRatio);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file); // Fallback ke file asli jika context canvas gagal
      }

      // Memastikan teknik filtering gambar halus saat di-resize
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const extMap: Record<string, string> = {
            "image/webp": ".webp",
            "image/jpeg": ".jpg",
            "image/png": ".png",
          };

          const lastDotIndex = file.name.lastIndexOf(".");
          const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
          const ext = extMap[targetFormat] || ".webp";
          const newFileName = `${baseName}${ext}`;

          const optimizedFile = new File([blob], newFileName, {
            type: targetFormat,
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        },
        targetFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca berkas gambar untuk proses optimasi."));
    };

    img.src = objectUrl;
  });
}

/**
 * Mengonversi berkas gambar menjadi berkas PDF (.pdf) menggunakan jsPDF.
 * ⚠️ Proporsi/aspect ratio gambar tetap dipertahankan persis dalam halaman PDF.
 */
export async function convertImageToPdfFile(file: File, maxWidthOrHeight = 1920): Promise<File> {
  // Jika file sudah berupa PDF, kembalikan langsung
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return file;
  }

  // Jika bukan gambar, kembalikan langsung
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Kompresi awal sebelum masuk PDF
  const optimizedImgFile = await compressAndResizeImage(file, {
    targetFormat: "image/jpeg",
    quality: 0.85,
    maxWidthOrHeight,
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(optimizedImgFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const imgWidth = img.width;
      const imgHeight = img.height;
      const orientation = imgWidth > imgHeight ? "landscape" : "portrait";

      // Buat dokumen PDF baru dengan ukuran halaman pas sesuai rasio gambar (in mm atau pt)
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [imgWidth, imgHeight],
      });

      // Render gambar ke canvas untuk konversi ke JPEG Data URL yang 100% aman bagi jsPDF
      const canvas = document.createElement("canvas");
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, imgWidth, imgHeight);
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(dataUrl, "JPEG", 0, 0, imgWidth, imgHeight);
      } else {
        pdf.addImage(img, "JPEG", 0, 0, imgWidth, imgHeight);
      }


      const pdfArrayBuffer = pdf.output("arraybuffer");
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });

      const lastDotIndex = file.name.lastIndexOf(".");
      const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const pdfFileName = `${baseName}.pdf`;

      const pdfFile = new File([pdfBlob], pdfFileName, {
        type: "application/pdf",
        lastModified: Date.now(),
      });

      resolve(pdfFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal mengonversi gambar ke dokumen PDF."));
    };

    img.src = objectUrl;
  });
}

/**
 * Pipeline Utama: Validasi -> Optimasi / Konversi -> Formatter Output
 */
export async function processFile(
  file: File,
  options: FileValidationOptions
): Promise<ProcessedFileResult> {
  // Step 1: Validasi File
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let finalFile = file;
  let isOptimized = false;

  // Step 2: Konversi ke PDF jika opsi convertToPdf diaktifkan (misal untuk KK / KTP)
  if (options.convertToPdf && file.type.startsWith("image/")) {
    finalFile = await convertImageToPdfFile(file, options.maxWidthOrHeight ?? 1920);
    isOptimized = true;
  }
  // Step 3: Kompresi & Resize biasa untuk gambar non-PDF
  else if (file.type.startsWith("image/") && (options.targetFormat || options.maxWidthOrHeight)) {
    finalFile = await compressAndResizeImage(file, {
      targetFormat: options.targetFormat || (file.type as ImageFormat),
      quality: options.quality ?? 0.8,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    });
    isOptimized = finalFile.size < file.size || finalFile.type !== file.type;
  }

  const previewUrl = URL.createObjectURL(finalFile);

  return {
    file: finalFile,
    size: finalFile.size,
    type: finalFile.type,
    isOptimized,
    previewUrl,
  };
}
