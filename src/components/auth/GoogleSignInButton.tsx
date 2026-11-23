"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";

interface GoogleSignInButtonProps {
  nextPath?: string;
  label?: string;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
  id?: string;
}

export function GoogleSignInButton({
  nextPath = "/dashboard",
  label,
  fullWidth = false,
  variant = "primary",
  id = "google-signin-button",
}: GoogleSignInButtonProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      showToast(t.auth.setupMissingBody, "error");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        window.location.origin;
      const safeNext =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        showToast(error.message || t.auth.errorOAuth, "error");
        setLoading(false);
      }
    } catch {
      showToast(t.auth.errorOAuth, "error");
      setLoading(false);
    }
  };

  const buttonClasses =
    variant === "primary"
      ? "bg-[#2D5A47] text-white hover:bg-[#234738] shadow-sm hover:shadow-md"
      : "bg-white text-[#1C1917] border border-[#D5CDC1] hover:bg-[#F5F2EC] shadow-xs";

  return (
    <button
      type="button"
      id={id}
      onClick={handleSignIn}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${buttonClasses} ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {loading ? (
        <Loader2 className="h-4.5 w-4.5 animate-spin" />
      ) : (
        <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill={variant === "primary" ? "#FFFFFF" : "#4285F4"}
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65Z"
          />
          <path
            fill={variant === "primary" ? "#E9F2EE" : "#34A853"}
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill={variant === "primary" ? "#D5E6DF" : "#FBBC05"}
            d="M5.29 14.29A7.22 7.22 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l4-3.1Z"
          />
          <path
            fill={variant === "primary" ? "#FFFFFF" : "#EA4335"}
            d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4 3.1c.94-2.84 3.59-4.95 6.71-4.95Z"
          />
        </svg>
      )}
      <span>{loading ? t.auth.redirecting : label || t.common.continueWithGoogle}</span>
    </button>
  );
}
