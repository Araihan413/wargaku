"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, HardDrive, Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSelectLocalFile: (file: File) => Promise<void> | void;
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
  isLoading = false,
}) => {
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

  // Fallback to stop loading if Google Sign-In popup is closed/dismissed
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowFocus = () => {
      if (isOpeningDrivePicker) {
        // Wait 1.5 seconds to see if the picker dialog successfully launches.
        // If it doesn't launch, we safely stop the loading state.
        const timer = setTimeout(() => {
          setIsOpeningDrivePicker(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isOpen, isOpeningDrivePicker]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading || isOpeningDrivePicker) return;
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
      toast.error("Integrasi Google Drive belum dikonfigurasi.");
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
            const downloadToastId = toast.loading("Mengunduh berkas dari Google Drive...");
            
            try {
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                {
                  headers: {
                    Authorization: `Bearer ${oauthToken}`,
                  },
                }
              );
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const blob = await response.blob();
              const file = new File([blob], doc.name || "ktp_drive_file", {
                type: doc.mimeType || blob.type,
              });

              toast.success("Berkas Google Drive berhasil diimpor!", { id: downloadToastId });
              await onSelectLocalFile(file);
              handleClose();
            } catch (err) {
              console.error("Gagal mengunduh file dari Google Drive:", err);
              toast.error(
                "Gagal mengunduh berkas dari Google Drive. Pastikan izin akses berkas benar.",
                { id: downloadToastId }
              );
            }
          }
          setIsOpeningDrivePicker(false);
        })
        .build();

      picker.setVisible(true);
      setIsOpeningDrivePicker(false); // Turn off loading once picker is shown
    } catch (err) {
      console.error(err);
      toast.error("Gagal menampilkan jendela Google Picker");
      setIsOpeningDrivePicker(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-border transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-4">
          <h3 className="text-sm font-bold text-gray-heading-main">{title}</h3>
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
                    Unggah berkas gambar (JPG, PNG) atau dokumen PDF langsung dari perangkat Anda.
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
                      <span className="text-[10px] text-blue-600 font-semibold">
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
          </div>
        </div>
      </div>
    </div>
  );
};
