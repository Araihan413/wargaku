"use client";

import React from "react";
import { X, Loader2, AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya",
  cancelText = "Batal",
  variant = "primary",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-50 text-red-600",
          icon: <AlertTriangle className="h-5 w-5" />,
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600",
          icon: <AlertTriangle className="h-5 w-5" />,
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
        };
      case "primary":
      default:
        return {
          iconBg: "bg-primary/10 text-primary",
          icon: <HelpCircle className="h-5 w-5" />,
          confirmBtn: "bg-primary hover:bg-primary-900 text-white focus:ring-primary",
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md rounded-3xl border border-gray-border bg-gray-card shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl p-1.5 text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-heading-main tracking-tight">
            {title}
          </h3>
          <div className="text-xs text-gray-secondary-text leading-relaxed">
            {description}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-border pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-border px-4 py-2.5 text-xs font-semibold text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm active:scale-95 duration-100 ${styles.confirmBtn}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
