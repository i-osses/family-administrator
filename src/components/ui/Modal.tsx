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
  maxWidthClass = "sm:max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    // Lock background scroll cleanly on both desktop and iOS Safari
    const scrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-none bg-[#1C1917]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-fade-in box-border flex w-full max-w-full flex-col ${maxWidthClass} max-h-[100dvh] sm:max-h-[92dvh] overflow-hidden rounded-t-2xl border border-[#E7E1D8] bg-white shadow-2xl sm:rounded-2xl`}
        style={{
          paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Fixed Compact Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EFEAE2] px-4 pt-3.5 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3">
          <div className="min-w-0 flex-1">
            <h2
              id="modal-title"
              className="truncate font-display text-base font-bold tracking-tight text-[#1C1917] sm:text-lg"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 line-clamp-2 text-xs text-[#6B655E]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Compact Body (zero-scroll on standard mobile, emergency fallback scroll only on tiny viewports) */}
        <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-3 pb-1 sm:px-5 sm:pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
