import React, { useRef } from "react";
import { ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { SystemConfigFormState } from "../types";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { FILE_PRESETS } from "@/lib/file-processor/presets";

interface BrandingLogoFormSectionProps {
  form: SystemConfigFormState;
  onChange: (field: keyof SystemConfigFormState, value: string | null) => void;
}

export const BrandingLogoFormSection: React.FC<BrandingLogoFormSectionProps> = ({
  form,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isLoading: isUploading } = useFileProcessor(FILE_PRESETS.LOGO);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, FILE_PRESETS.LOGO.folder, form.logoPath);
      if (result) {
        onChange("logoPath", result.url);
        toast.success("Logo berhasil diunggah.");
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    const currentLogo = form.logoPath;
    onChange("logoPath", null);
    toast.info("Logo dihapus.");

    if (currentLogo) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentLogo }),
        });
      } catch (err) {
        console.error("Gagal menghapus logo dari Cloudinary:", err);
      }
    }
  };

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-border bg-gray-sidebar-hover/30">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
          <ImageIcon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-heading-main tracking-tight">
            Branding & Logo
          </h2>
          <p className="text-[11px] text-gray-secondary-text">
            Logo resmi RT/Korp yang akan ditampilkan di header aplikasi.
            Rekomendasi: format PNG transparan, ukuran minimum 200×200px, maks 2 MB.
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col sm:flex-row gap-6">
        {/* Logo Preview Box */}
        <div className="shrink-0">
          <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-gray-border bg-gray-50 flex items-center justify-center overflow-hidden">
            {form.logoPath ? (
              <Image
                src={form.logoPath}
                alt="Preview Logo RT"
                width={144}
                height={144}
                className="w-full h-full object-contain p-2"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-secondary-text p-3">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-[10px] font-medium text-center">
                  Logo Belum Diunggah
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3 w-full">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider">
              Unggah Gambar Logo
            </label>
            <p className="text-[11px] text-gray-secondary-text">
              Format: JPG, PNG, atau WebP. Ukuran file maks 2 MB.
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah Logo...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Pilih File Logo</span>
              </>
            )}
          </button>

          {/* Remove Button */}
          {form.logoPath && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer ml-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Logo</span>
            </button>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

        </div>
      </div>
    </div>
  );
};
