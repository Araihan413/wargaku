"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, HardDrive, Cloud, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSelectLocalFile: (file: File) => Promise<void> | void;
  onSelectDriveUrl: (url: string) => Promise<void> | void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  title = "Pilih Sumber Berkas",
  description = "Silakan pilih metode pengunggahan berkas yang ingin Anda gunakan.",
  onSelectLocalFile,
  onSelectDriveUrl,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<"menu" | "drive">("menu");
  const [driveUrl, setDriveUrl] = useState("");
  const [isOpeningDrivePicker, setIsOpeningDrivePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  // Load Google Picker SDK scripts on demand
  useEffect(() => {
    if (!isOpen) return;

    if (!document.getElementById("gapi-script")) {
      const scriptGapi = document.createElement("script");
      scriptGapi.id = "gapi-script";
      scriptGapi.src = "https://apis.google.com/js/api.js";
      scriptGapi.async = true;
      scriptGapi.defer = true;
      document.body.appendChild(scriptGapi);
    }

    if (!document.getElementById("gis-script")) {
      const scriptGis = document.createElement("script");
      scriptGis.id = "gis-script";
      scriptGis.src = "https://accounts.google.com/gsi/client";
      scriptGis.async = true;
      scriptGis.defer = true;
      document.body.appendChild(scriptGis);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading || isOpeningDrivePicker) return;
    setActiveTab("menu");
    setDriveUrl("");
    onClose();
  };

  const handleLocalClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onSelectLocalFile(file);
      handleClose();
    }
  };

  // Google Drive Picker API trigger
  const handleOpenGoogleDrivePicker = () => {
    if (!clientId || !apiKey) {
      // Fallback ke tab link jika kredensial belum ada
      setActiveTab("drive");
      return;
    }

    setIsOpeningDrivePicker(true);

    try {
      if (typeof window.gapi === "undefined" || typeof window.google === "undefined") {
        toast.error("Sedang memuat SDK Google Drive, silakan coba 2 detik lagi.");
        setIsOpeningDrivePicker(false);
        return;
      }

      window.gapi.load("picker", () => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
          callback: async (response: any) => {
            if (response.error !== undefined) {
              console.error(response);
              toast.error("Gagal mendapatkan izin akses Google Drive");
              setIsOpeningDrivePicker(false);
              return;
            }

            const oauthToken = response.access_token;
            createPicker(oauthToken);
          },
        });

        tokenClient.requestAccessToken({ prompt: "consent" });
      });
    } catch (err) {
      console.error("Google Picker Error:", err);
      toast.error("Terjadi kesalahan saat membuka Google Drive Picker");
      setIsOpeningDrivePicker(false);
    }
  };

  const createPicker = (oauthToken: string) => {
    try {
      const google = window.google;
      const view = new google.picker.View(google.picker.ViewId.DOCS);
      view.setMimeTypes("image/png,image/jpeg,image/webp,application/pdf");

      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setAppId(clientId)
        .setOAuthToken(oauthToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setDeveloperKey(apiKey)
        .setCallback(async (data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const doc = data.docs[0];
            const selectedUrl = doc.url || `https://drive.google.com/file/d/${doc.id}/view`;
            toast.success(`Berkas "${doc.name}" dari Google Drive dipilih!`);
            await onSelectDriveUrl(selectedUrl);
            handleClose();
          }
          setIsOpeningDrivePicker(false);
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menampilkan jendela Google Picker");
      setIsOpeningDrivePicker(false);
    }
  };

  const handleSubmitDriveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;
    await onSelectDriveUrl(driveUrl.trim());
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-border transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-4">
          <div className="flex items-center gap-2">
            {activeTab === "drive" && (
              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                disabled={isLoading || isOpeningDrivePicker}
                className="rounded-lg p-1 text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-sm font-bold text-gray-heading-main">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading || isOpeningDrivePicker}
            className="rounded-lg p-1.5 text-gray-secondary-text hover:bg-gray-sidebar-hover hover:text-gray-heading-main cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="pt-4">
          {activeTab === "menu" ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-secondary-text leading-relaxed">
                {description}
              </p>

              <div className="grid gap-3">
                {/* Opsi 1: File Lokal */}
                <button
                  type="button"
                  onClick={handleLocalClick}
                  disabled={isLoading || isOpeningDrivePicker}
                  className="group relative flex items-start gap-3.5 rounded-xl border border-gray-border p-4 text-left transition-all hover:border-primary hover:bg-primary-100/20 cursor-pointer disabled:opacity-60"
                >
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-heading-main group-hover:text-primary transition-colors flex items-center gap-1.5">
                      Pilih dari File Komputer / HP
                    </h4>
                    <p className="mt-0.5 text-[11px] text-gray-secondary-text leading-normal">
                      Unggah berkas gambar (JPG, PNG, WebP) atau dokumen PDF langsung dari perangkat Anda.
                    </p>
                  </div>
                </button>

                {/* Input File Tersembunyi */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Opsi 2: Google Drive Otomatis (Pop-up Google Picker) */}
                <button
                  type="button"
                  onClick={handleOpenGoogleDrivePicker}
                  disabled={isLoading || isOpeningDrivePicker}
                  className="group relative flex items-start gap-3.5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer disabled:opacity-60"
                >
                  <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    {isOpeningDrivePicker ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Cloud className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-blue-950 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      <span>Buka Google Drive (Otomatis)</span>
                      {isOpeningDrivePicker && (
                        <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                          Memuat Google Picker...
                        </span>
                      )}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-blue-800/80 leading-normal">
                      Otomatis membuka jendela Google Drive akun Anda untuk memilih berkas secara langsung.
                    </p>
                  </div>
                </button>
              </div>

              {/* Opsi Masukan Link Drive Manual */}
              <div className="text-center pt-1 border-t border-gray-border/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("drive")}
                  className="text-[11px] font-semibold text-gray-secondary-text hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Atau tempelkan link Google Drive secara manual</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Tab Form Google Drive Manual Link */
            <form onSubmit={handleSubmitDriveUrl} className="space-y-4">
              {(!clientId || !apiKey) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <span className="font-bold">Info Integrasi:</span> Kredensial <code className="bg-amber-100 px-1 rounded text-[10px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> belum dikonfigurasi di file <code className="bg-amber-100 px-1 rounded text-[10px]">.env</code>. Anda tetap dapat menempelkan link Google Drive berkas Anda secara manual di bawah ini.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-heading-main flex items-center gap-1">
                  Link Google Drive Berkas
                </label>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full rounded-xl border border-gray-border bg-gray-page-bg px-3.5 py-2 text-xs text-gray-heading-main focus:border-blue-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-secondary-text">
                  Pastikan izin akses berkas di Google Drive Anda diatur ke <span className="font-bold">&quot;Siapa saja yang memiliki link&quot;</span>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  disabled={isLoading}
                  className="rounded-xl border border-gray-border px-3.5 py-2 text-xs font-semibold text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !driveUrl.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-xs"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Gunakan Link Drive
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
