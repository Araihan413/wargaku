import { jsPDF } from "jspdf";
import { toast } from "sonner";

/**
 * Utility function to convert and download any document/image URL into a clean PDF file.
 * 
 * @param fileUrl URL of the image or PDF file (Cloudinary, Google Drive, or Local URL)
 * @param defaultFileName Target download file name without extension (e.g., "Scan_KK_Budi")
 * @param documentTitle Optional document title printed in the PDF header
 */
export async function downloadFileAsPdf(
  fileUrl: string,
  defaultFileName: string,
  documentTitle = "DOKUMEN WARGAKU"
): Promise<void> {
  if (!fileUrl) {
    toast.error("URL berkas tidak ditemukan.");
    return;
  }

  const toastId = toast.loading("Menyiapkan berkas PDF...");

  try {
    const sanitizedFileName = defaultFileName.replace(/[^a-zA-Z0-9_-]/g, "_");

    // 1. Jika URL sudah berformat PDF, langsung unduh sebagai file PDF
    if (fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.includes("/f_pdf/")) {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Gagal mengunduh berkas PDF dari server");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${sanitizedFileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Berkas PDF berhasil diunduh!", { id: toastId });
      return;
    }

    // 2. Jika URL adalah Gambar (JPG/PNG/WebP/Cloudinary), konversi ke PDF A4 menggunakan jsPDF
    const img = new Image();
    img.crossOrigin = "Anonymous";

    // Proxy gambar atau fetch ke base64 jika ada CORS
    const imageBase64 = await fetchImageAsBase64(fileUrl);

    img.onload = () => {
      try {
        const doc = new jsPDF({
          orientation: img.width > img.height ? "landscape" : "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header Dokumen WARGAKU
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, pageWidth, 18, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(documentTitle.toUpperCase(), 12, 12);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Dicetak via WARGAKU | Tanggal: ${new Date().toLocaleDateString("id-ID")}`, pageWidth - 12, 12, {
          align: "right",
        });

        // Margin & Kalkulasi Ukuran Gambar agar Proporsional di A4
        const marginX = 12;
        const marginTop = 24;
        const marginBottom = 12;

        const maxImgWidth = pageWidth - marginX * 2;
        const maxImgHeight = pageHeight - marginTop - marginBottom;

        let imgWidth = img.width;
        let imgHeight = img.height;

        const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;

        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = marginTop + (maxImgHeight - imgHeight) / 2;

        // Tambahkan Gambar ke Dokumen PDF
        doc.addImage(imageBase64 || img, "JPEG", xPos, yPos, imgWidth, imgHeight);

        // Footer Dokumen
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Dokumen resmi digital sistem informasi kependudukan WARGAKU.", pageWidth / 2, pageHeight - 5, {
          align: "center",
        });

        // Simpan PDF
        doc.save(`${sanitizedFileName}.pdf`);
        toast.success("Dokumen PDF berhasil dibuat & diunduh!", { id: toastId });
      } catch (pdfErr) {
        console.error("PDF generation error:", pdfErr);
        toast.error("Gagal menyusun halaman PDF", { id: toastId });
      }
    };

    img.onerror = () => {
      toast.error("Gagal memuat gambar untuk konversi PDF.", { id: toastId });
    };

    img.src = imageBase64;
  } catch (error) {
    console.error("Download PDF error:", error);
    toast.error("Terjadi kesalahan saat mengunduh PDF.", { id: toastId });
  }
}

/**
 * Utility helper to convert Image URL to Base64 to bypass CORS issues for jsPDF
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Return original url if fetch fails
    return url;
  }
}
