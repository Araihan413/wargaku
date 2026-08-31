import React from "react";
import { X } from "lucide-react";

interface PublicDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badges?: React.ReactNode;
  metadata?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export const PublicDetailModal: React.FC<PublicDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  badges,
  metadata,
  children,
  footerActions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5 shrink-0 bg-white">
          <div className="space-y-1.5 flex-1 pr-2 min-w-0">
            {badges && <div className="flex flex-wrap items-center gap-1.5 mb-1">{badges}</div>}
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug wrap-break-word">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup Rincian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-sm text-slate-700 leading-relaxed font-normal scrollbar-thin">
          {metadata}
          <div className="whitespace-pre-wrap">{children}</div>
        </div>

        {/* Fixed Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs text-center"
          >
            Tutup
          </button>
          {footerActions || <div />}
        </div>
      </div>
    </div>
  );
};
