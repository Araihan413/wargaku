"use client";

import React, { useState } from "react";
import { X, UserMinus, AlertTriangle, Home } from "lucide-react";
import { toast } from "sonner";
import { CoordinatorItem } from "./CoordinatorTable";

interface DeactivateCoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  coordinator: CoordinatorItem | null;
}

export const DeactivateCoordinatorModal: React.FC<DeactivateCoordinatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  coordinator,
}) => {
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevCoordinator, setPrevCoordinator] = useState<CoordinatorItem | null>(null);

  if (coordinator !== prevCoordinator) {
    setPrevCoordinator(coordinator);
    if (coordinator) {
      const nonOwnedIds = (coordinator.properties || [])
        .filter(p => !p.isOwnedByCoordinator)
        .map(p => p.id);
      setSelectedProperties(nonOwnedIds);
    } else {
      setSelectedProperties([]);
    }
  }

  const handleToggleProperty = (id: number) => {
    setSelectedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setSelectedProperties([]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinator) return;

    if (selectedProperties.length === 0) {
      toast.error("Pilih setidaknya satu kos untuk dicabut dari koordinator ini");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/users/${coordinator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke_coordinator",
          payload: {
            propertyIds: selectedProperties,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mencabut jabatan koordinator");
      }

      toast.success(result.message || "Jabatan berhasil dicabut");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !coordinator) return null;

  const hasProperties = coordinator.properties && coordinator.properties.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-card border border-gray-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <UserMinus className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-gray-heading-main">
              Copot Jabatan Koordinator
            </h2>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-placeholder hover:text-gray-heading-main p-1.5 rounded-lg hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Pencabutan Jabatan Parsial</p>
                <p className="mt-1 leading-relaxed opacity-90">
                  Anda akan mencabut jabatan pengurus kos dari <strong>{coordinator.name}</strong>. Silakan pilih kos mana saja yang ingin dicabut dari tanggung jawabnya. 
                  Jika kos tersebut adalah miliknya sendiri, maka tidak dapat dicabut (Otomatis ditolak). Saat dicabut, pemilik asli akan otomatis menjadi koordinator.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-heading-main tracking-wider uppercase">Daftar Kos yang Dikelola</h3>
              
              {!hasProperties ? (
                <div className="text-center py-8 text-sm text-gray-placeholder italic border border-dashed border-gray-border rounded-xl">
                  Tidak ada data kos.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {coordinator.properties!.map(prop => {
                    const isOwned = prop.isOwnedByCoordinator;
                    const isSelected = selectedProperties.includes(prop.id);
                    
                    return (
                      <label 
                        key={prop.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isOwned 
                            ? "bg-gray-sidebar-hover/30 border-gray-border opacity-70 cursor-not-allowed" 
                            : isSelected 
                              ? "bg-rose-50 border-rose-200 cursor-pointer" 
                              : "bg-gray-card border-gray-border hover:border-gray-placeholder cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isOwned}
                          checked={isOwned ? false : isSelected}
                          onChange={() => handleToggleProperty(prop.id)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 disabled:opacity-50 border-gray-300"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Home className={`h-4 w-4 ${isOwned ? "text-gray-placeholder" : "text-gray-heading-main"}`} />
                            <span className={`text-sm font-semibold ${isOwned ? "text-gray-placeholder" : "text-gray-heading-main"}`}>
                              {prop.name}
                            </span>
                          </div>
                          {isOwned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-border text-gray-secondary-text rounded-full uppercase tracking-wider">
                              Milik Sendiri
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-border px-6 py-4 shrink-0 gap-3 bg-gray-card">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-5 py-2.5 bg-gray-sidebar-hover hover:bg-gray-border/50 border border-gray-border rounded-xl text-xs font-semibold text-gray-heading-main cursor-pointer transition-all disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedProperties.length === 0}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? "Memproses..." : `Copot Jabatan (${selectedProperties.length} Kos)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
