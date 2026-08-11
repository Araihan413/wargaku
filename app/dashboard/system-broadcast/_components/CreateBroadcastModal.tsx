"use client";

import React, { useState } from "react";
import {
  Radio,
  Wrench,
  AlertTriangle,
  Sparkles,
  Info,
  Loader2,
  Send,
  Bell,
  X,
} from "lucide-react";
import { CreateBroadcastPayload } from "../types";

interface CreateBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBroadcastPayload) => Promise<void>;
  isSubmitting: boolean;
}

export const CreateBroadcastModal: React.FC<CreateBroadcastModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "maintenance" | "feature" | "warning">("info");
  const [sendPush, setSendPush] = useState(false);
  const [sendInAppNotif, setSendInAppNotif] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title: title.trim(),
      message: message.trim(),
      type,
      sendPush,
      sendInAppNotif,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <Wrench className="w-3.5 h-3.5" /> Maintenance
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 text-rose-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Peringatan
          </span>
        );
      case "feature":
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" /> Fitur Baru
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-blue-700">
            <Info className="w-3.5 h-3.5" /> Informasi
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-gray-border rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-border flex items-center justify-between bg-white rounded-t-2xl">
          <h3 className="text-base font-extrabold text-gray-heading-main flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary shrink-0" />
            Buat Broadcast Sistem Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-placeholder hover:text-gray-heading-main hover:bg-gray-sidebar-hover rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="create-broadcast-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4.5 scrollbar-thin">
            {/* Type Select */}
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Tipe / Kategori <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["info", "maintenance", "feature", "warning"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      type === t
                        ? "border-primary bg-primary/10 text-primary shadow-2xs"
                        : "border-gray-border bg-gray-card text-gray-secondary-text hover:border-gray-border hover:bg-gray-sidebar-hover"
                    }`}
                  >
                    {getTypeBadge(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Judul Broadcast <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pemeliharaan Server Sistem"
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Pesan Pengumuman <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ketikkan isi pesan pengumuman sistem secara jelas..."
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Expiry date */}
            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Waktu Kedaluwarsa Otomatis
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <span className="text-[10px] text-gray-placeholder mt-1 block">
                Kosongkan jika pengumuman berlaku terus sampai Anda menariknya manual.
              </span>
            </div>

            {/* Delivery Channels */}
            <div className="p-4 bg-slate-50 border border-gray-border rounded-xl space-y-2.5 text-xs">
              <span className="font-bold text-gray-heading-main block mb-1">
                Saluran Pengiriman Notifikasi:
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-gray-heading-main font-medium">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded border-gray-border text-primary focus:ring-primary"
                />
                <span>Tampilkan sebagai Banner Carousel di Dashboard (Default)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-heading-main font-medium hover:text-primary transition">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="rounded border-gray-border text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Kirim Push Notification (OneSignal ke HP/Browser)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-heading-main font-medium hover:text-primary transition">
                <input
                  type="checkbox"
                  checked={sendInAppNotif}
                  onChange={(e) => setSendInAppNotif(e.target.checked)}
                  className="rounded border-gray-border text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Kirim juga ke Lonceng Notifikasi Warga
                </span>
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-5 py-3.5 border-t border-gray-border flex justify-end items-center gap-2 bg-slate-50/80 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-border text-xs font-bold text-gray-secondary-text hover:bg-gray-sidebar-hover transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
