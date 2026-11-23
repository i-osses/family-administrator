"use client";

import Link from "next/link";
import {
  CalendarDays,
  BookHeart,
  Wallet,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { DEFAULT_BANNER_URL } from "@/lib/constants";

export function LandingView() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Users,
      title: t.landing.pillars.familyTitle,
      desc: t.landing.pillars.familyDesc,
      tint: "bg-[#E9F2EE] text-[#2D5A47]",
    },
    {
      icon: CalendarDays,
      title: t.landing.pillars.calendarTitle,
      desc: t.landing.pillars.calendarDesc,
      tint: "bg-[#EBF2F8] text-[#3B6998]",
    },
    {
      icon: BookHeart,
      title: t.landing.pillars.memoriesTitle,
      desc: t.landing.pillars.memoriesDesc,
      tint: "bg-[#FBF0EC] text-[#C86D51]",
    },
    {
      icon: Wallet,
      title: t.landing.pillars.budgetTitle,
      desc: t.landing.pillars.budgetDesc,
      tint: "bg-[#FAF4E6] text-[#9E7022]",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#E7E1D8]/80 bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="focus:outline-none">
            <BrandMark label={t.appName} />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/login"
              id="header-login-link"
              className="hidden rounded-xl border border-[#D5CDC1] bg-white px-4 py-2 text-sm font-semibold text-[#1C1917] transition hover:bg-[#F3EFE9] sm:inline-flex"
            >
              {t.common.signIn}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-18 sm:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#2D5A47] uppercase">
                {t.tagline}
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.03em] text-[#1C1917] sm:text-5xl sm:leading-[1.1]">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#57534E] sm:text-lg">
                {t.landing.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <GoogleSignInButton
                  id="landing-google-cta"
                  label={t.landing.ctaPrimary}
                  variant="primary"
                />
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5CDC1] bg-white px-5 py-3 text-sm font-semibold text-[#1C1917] transition hover:bg-[#F3EFE9]"
                >
                  <span>{t.landing.ctaSecondary}</span>
                  <ArrowRight className="h-4 w-4 text-[#78716C]" />
                </Link>
              </div>

              <div className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-[#78716C]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2D5A47]" />
                <span>{t.landing.trustNote}</span>
              </div>
            </div>

            {/* Editorial Visual Preview */}
            <div className="lg:col-span-6">
              <div className="surface-elevated overflow-hidden rounded-3xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAE4DB]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DEFAULT_BANNER_URL}
                    alt={t.landing.previewCard.familyName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/65 via-[#1C1917]/15 to-transparent" />
                  <div className="absolute right-5 bottom-4 left-5 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider text-white/80 uppercase">
                        {t.landing.previewCard.spotlightLabel}
                      </p>
                      <p className="font-display text-xl font-bold tracking-tight">
                        {t.landing.previewCard.familyName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid divide-y divide-[#EFEAE2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="p-4">
                    <p className="text-[11px] font-semibold tracking-wide text-[#78716C] uppercase">
                      {t.landing.previewCard.upcomingTitle}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[#1C1917]">
                      {t.landing.previewCard.upcomingEvent}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold tracking-wide text-[#78716C] uppercase">
                      {t.landing.previewCard.budgetTitle}
                    </p>
                    <p className="mt-1.5 font-display text-base font-bold tabular-nums text-[#2D5A47]">
                      {t.landing.previewCard.budgetValue}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold tracking-wide text-[#78716C] uppercase">
                      {t.landing.previewCard.memoryTitle}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[#1C1917]">
                      {t.landing.previewCard.memoryNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="border-t border-[#E7E1D8] bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
                {t.landing.pillarsHeading}
              </h2>
              <p className="mt-3 text-base text-[#57534E]">
                {t.landing.pillarsSubheading}
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-[#E7E1D8] bg-[#FAF8F5]/70 p-6 transition hover:border-[#D5CDC1] hover:bg-white hover:shadow-sm"
                  >
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.tint}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-[#1C1917]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
                      {item.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E1D8] bg-[#FAF8F5] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[#78716C] sm:flex-row sm:px-6">
          <p>{t.landing.footerCopy}</p>
          <LanguageToggle compact />
        </div>
      </footer>
    </div>
  );
}
