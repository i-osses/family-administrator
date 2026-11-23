"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1C1917]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-fade-in w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-t-2xl border border-[#E7E1D8] bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="modal-title"
              className="font-display text-lg font-bold tracking-tight text-[#1C1917]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[#6B655E]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
