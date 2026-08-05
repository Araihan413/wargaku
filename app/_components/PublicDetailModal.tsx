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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 sm:px-8 sm:py-5 shrink-0 bg-white">
          <div className="space-y-1.5 flex-1 pr-2">
            {badges && <div className="flex flex-wrap items-center gap-2 mb-1">{badges}</div>}
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-sm text-slate-700 leading-relaxed font-normal">
          {metadata}
          <div className="whitespace-pre-wrap">{children}</div>
        </div>

        {/* Fixed Footer (Stays Still, non-scrollable) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 sm:px-8 border-t border-slate-100 bg-slate-50/80 shrink-0">
          {footerActions || <div />}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
