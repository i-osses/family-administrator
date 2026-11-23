"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 left-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:left-auto md:right-6"
      >
        {toasts.map((toast) => {
          const styles =
            toast.variant === "success"
              ? "border-[#C7DDD3] bg-[#F5FBF8] text-[#1E4535]"
              : toast.variant === "error"
                ? "border-[#F1C9BE] bg-[#FDF5F3] text-[#8F3A24]"
                : "border-[#E5DED4] bg-white text-[#1C1917]";

          const Icon =
            toast.variant === "success"
              ? CheckCircle2
              : toast.variant === "error"
                ? AlertCircle
                : Info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-fade-in flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${styles}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm font-medium leading-snug">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
