import React from "react";
import { X, FileText, Download } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  title: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title,
}) => {
  if (!isOpen || !fileUrl) return null;

  const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative w-full max-w-4xl h-[85vh] bg-gray-card border border-gray-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Pratinjau Dokumen</h3>
              <p className="text-[10px] text-gray-secondary-text">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Unduh File"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 bg-gray-900/5 p-4 flex items-center justify-center overflow-auto">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-lg border border-gray-border"
              title="Pratinjau PDF"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            />
          )}
        </div>
      </div>
    </div>
  );
};
