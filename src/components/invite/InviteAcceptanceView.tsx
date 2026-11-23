"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Mail,
  Shield,
  Users,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { InvitationPreview } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { DEFAULT_BANNER_URL } from "@/lib/constants";

interface InviteAcceptanceViewProps {
  token: string;
  invitation: InvitationPreview | null;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export function InviteAcceptanceView({
  token,
  invitation,
  isAuthenticated,
  userEmail,
}: InviteAcceptanceViewProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as {
        familyId?: string;
        error?: string;
      };

      if (!response.ok || !data.familyId) {
        showToast(data.error || t.invite.errorAccepting, "error");
        setAccepting(false);
        return;
      }

      try {
        window.localStorage.setItem(
          "family_admin_active_family",
          data.familyId
        );
      } catch {
        // Ignore storage errors
      }

      showToast(t.invite.acceptedSuccess, "success");
      router.push("/dashboard/family");
      router.refresh();
    } catch {
      showToast(t.invite.errorAccepting, "error");
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/">
          <BrandMark label={t.appName} />
        </Link>
        <LanguageToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {!invitation ? (
          <div className="surface-elevated w-full max-w-md rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF0EC] text-[#C86D51]">
              <XCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-5 font-display text-xl font-bold text-[#1C1917]">
              {t.invite.notFoundTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              {t.invite.notFoundDesc}
            </p>
            <div className="mt-6">
              <Link href="/" className="btn-secondary w-full">
                {t.common.backToHome}
              </Link>
            </div>
          </div>
        ) : (
          <div className="surface-elevated w-full max-w-lg overflow-hidden rounded-3xl">
            {/* Family Banner */}
            <div className="relative h-44 w-full bg-[#EAE4DB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invitation.spotlight_banner_url || DEFAULT_BANNER_URL}
                alt={invitation.family_name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/75 via-[#1C1917]/20 to-transparent" />
              <div className="absolute right-6 bottom-5 left-6 text-white">
                <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                  {t.invite.pageTitle}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  {invitation.family_name}
                </h1>
              </div>
            </div>

            <div className="p-7">
              {invitation.status === "expired" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FAF4E6] text-[#B8862D]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
                    {t.invite.expiredTitle}
                  </h2>
                  <p className="mt-2 text-sm text-[#57534E]">
                    {t.invite.expiredDesc}
                  </p>
                  <Link href="/" className="btn-secondary mt-6 w-full">
                    {t.common.backToHome}
                  </Link>
                </div>
              ) : invitation.status === "accepted" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F2EE] text-[#2D5A47]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
                    {t.invite.alreadyAcceptedTitle}
                  </h2>
                  <p className="mt-2 text-sm text-[#57534E]">
                    {t.invite.alreadyAcceptedDesc}
                  </p>
                  <Link href="/dashboard" className="btn-primary mt-6 w-full">
                    <span>{t.invite.goToDashboard}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <dl className="space-y-3 rounded-2xl border border-[#EFEAE2] bg-[#FAF8F5] p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[#6B655E]">
                        <Users className="h-4 w-4 text-[#2D5A47]" />
                        <span>{t.invite.invitedBy}</span>
                      </dt>
                      <dd className="font-semibold text-[#1C1917]">
                        {invitation.inviter_name || t.common.unknownMember}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[#6B655E]">
                        <Shield className="h-4 w-4 text-[#2D5A47]" />
                        <span>{t.invite.roleAssigned}</span>
                      </dt>
                      <dd className="rounded-full bg-[#E9F2EE] px-2.5 py-0.5 text-xs font-semibold text-[#234738]">
                        {invitation.role === "admin"
                          ? t.common.admin
                          : t.common.member}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[#6B655E]">
                        <Mail className="h-4 w-4 text-[#2D5A47]" />
                        <span>{t.invite.invitedEmailLabel}</span>
                      </dt>
                      <dd className="truncate font-medium text-[#1C1917]">
                        {invitation.invited_email}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          id="accept-invitation-button"
                          onClick={handleAccept}
                          disabled={accepting}
                          className="btn-primary w-full py-3"
                        >
                          {accepting ? (
                            <>
                              <Loader2 className="h-4.5 w-4.5 animate-spin" />
                              <span>{t.invite.accepting}</span>
                            </>
                          ) : (
                            <span>{t.invite.acceptButton}</span>
                          )}
                        </button>
                        {userEmail && (
                          <p className="text-center text-xs text-[#78716C]">
                            {userEmail}
                          </p>
                        )}
                      </div>
                    ) : (
                      <GoogleSignInButton
                        id="invite-google-signin"
                        nextPath={`/invite/${token}`}
                        label={t.invite.signInToAccept}
                        fullWidth
                        variant="primary"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
