"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface LoginCardProps {
  nextPath: string;
  errorCode?: string;
  setupMissing: boolean;
}

export function LoginCard({
  nextPath,
  errorCode,
  setupMissing,
}: LoginCardProps) {
  const { t } = useLanguage();
  const isInviteFlow = nextPath.startsWith("/invite/");

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#57534E] transition hover:text-[#1C1917]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.common.backToHome}</span>
        </Link>
        <LanguageToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="surface-elevated w-full max-w-md rounded-3xl p-7 sm:p-9">
          <BrandMark label={t.appName} />

          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-[#1C1917]">
            {t.auth.loginTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
            {isInviteFlow ? t.auth.inviteNotice : t.auth.loginSubtitle}
          </p>

          {setupMissing && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#EAD9B0] bg-[#FAF4E6] p-3.5 text-xs leading-relaxed text-[#7A571A]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{t.auth.setupMissingTitle}</p>
                <p className="mt-1">{t.auth.setupMissingBody}</p>
              </div>
            </div>
          )}

          {errorCode && (
            <div className="mt-5 rounded-xl border border-[#F1C9BE] bg-[#FDF5F3] p-3.5 text-xs font-medium text-[#8F3A24]">
              {errorCode === "callback" ? t.auth.errorCallback : t.auth.errorOAuth}
            </div>
          )}

          <div className="mt-7">
            <GoogleSignInButton
              id="login-google-button"
              nextPath={nextPath}
              label={t.auth.googleButton}
              fullWidth
              variant="primary"
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#78716C]">
            <Lock className="h-3.5 w-3.5 text-[#2D5A47]" />
            <span>{t.auth.privacyNote}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
