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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            {badges && <div className="flex items-center gap-2">{badges}</div>}
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
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

        {/* Metadata section */}
        {metadata}

        {/* Main Body Content */}
        <div className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {footerActions || <div />}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
