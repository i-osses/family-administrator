"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
  Users,
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  Loader2,
  Lock,
  PlayCircle,
  Trophy,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Avatar } from "@/components/ui/Avatar";
import {
  DEFAULT_BANNER_URL,
  resolveCategoryColor,
} from "@/lib/constants";
import type {
  BudgetEntry,
  CalendarEvent,
  FamilyFeedPost,
} from "@/types/database";

export default function DashboardOverviewPage() {
  const { t, formatCurrency, formatDate, formatTime } = useLanguage();
  const { profile, activeFamily, members, moduleSettings, loadingFamilies } =
    useFamily();

  const [loadingData, setLoadingData] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentPosts, setRecentPosts] = useState<FamilyFeedPost[]>([]);
  const [monthEntries, setMonthEntries] = useState<BudgetEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadOverview = async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!activeFamily) {
        setUpcomingEvents([]);
        setRecentPosts([]);
        setMonthEntries([]);
        return;
      }

      setLoadingData(true);
      try {
        const supabase = createClient();
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-01`;
        const endOfMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );
        const endOfMonth = `${endOfMonthDate.getFullYear()}-${String(
          endOfMonthDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endOfMonthDate.getDate()).padStart(
          2,
          "0"
        )}`;

        const [eventsRes, feedRes, budgetRes] = await Promise.all([
          moduleSettings.show_calendar
            ? supabase
                .from("calendar_events")
                .select("*")
                .eq("family_id", activeFamily.id)
                .gte("end_time", now.toISOString())
                .order("start_time", { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] }),
          moduleSettings.show_family_feed
            ? supabase
                .from("family_feed_posts")
                .select("*")
                .eq("family_id", activeFamily.id)
                .order("created_at", { ascending: false })
                .limit(4)
            : Promise.resolve({ data: [] }),
          moduleSettings.show_family_budget
            ? supabase
                .from("budget_entries")
                .select("*")
                .eq("family_id", activeFamily.id)
                .gte("entry_date", startOfMonth)
                .lte("entry_date", endOfMonth)
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;
        setUpcomingEvents((eventsRes.data as CalendarEvent[]) ?? []);
        setRecentPosts((feedRes.data as FamilyFeedPost[]) ?? []);
        setMonthEntries((budgetRes.data as BudgetEntry[]) ?? []);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [
    activeFamily,
    moduleSettings.show_calendar,
    moduleSettings.show_family_feed,
    moduleSettings.show_family_budget,
  ]);

  if (loadingFamilies) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  if (!activeFamily) {
    return <NoFamilyState />;
  }

  const totalIncome = monthEntries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = monthEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  const memberMap = new Map(
    members.map((m) => [
      m.user_id,
      m.profile?.full_name || m.profile?.email || t.common.unknownMember,
    ])
  );

  const firstName =
    (profile.full_name || profile.email).split(" ")[0] || profile.email;

  return (
    <div className="space-y-6">
      {/* Spotlight Hero Banner */}
      <section className="surface-card overflow-hidden rounded-3xl">
        <div className="relative h-48 w-full bg-[#EAE4DB] sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeFamily.spotlight_banner_url || DEFAULT_BANNER_URL}
            alt={activeFamily.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-[#1C1917]/25 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 flex flex-col justify-between gap-4 sm:inset-x-7 sm:bottom-6 sm:flex-row sm:items-end">
            <div className="text-white">
              <p className="text-xs font-medium text-white/85">
                {t.overview.welcomeBack}, {firstName}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {activeFamily.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    src={member.profile?.avatar_url}
                    name={member.profile?.full_name || member.profile?.email}
                    size="sm"
                  />
                ))}
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {members.length}{" "}
                {members.length === 1
                  ? t.overview.memberSingular
                  : t.overview.membersCount}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Quick Actions Bar (Admin controlled) */}
        {moduleSettings.show_quick_actions && (
          <div className="grid grid-cols-2 divide-x divide-y divide-[#EFEAE2] bg-white sm:grid-cols-4 sm:divide-y-0">
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EBF2F8] text-[#3B6998]">
                <Plus className="h-4 w-4" />
              </span>
              <span className="truncate">{t.overview.addEvent}</span>
            </Link>
            <Link
              href="/dashboard/memories"
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F2EE] text-[#2D5A47]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="truncate">{t.overview.logMemory}</span>
            </Link>
            <Link
              href="/dashboard/my-space"
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF0EC] text-[#C86D51]">
                <Lock className="h-4 w-4" />
              </span>
              <span className="truncate">{t.overview.openMySpace}</span>
            </Link>
            <Link
              href="/dashboard/family"
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF4E6] text-[#9E7022]">
                <Users className="h-4 w-4" />
              </span>
              <span className="truncate">{t.overview.manageFamily}</span>
            </Link>
          </div>
        )}
      </section>

      {/* Admin-Enabled Shared Family Budget Snapshot (Hidden by default!) */}
      {moduleSettings.show_family_budget && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4.5 w-4.5 text-[#2D5A47]" />
              <h2 className="font-display text-base font-bold text-[#1C1917]">
                {t.overview.monthlyBudget}
              </h2>
            </div>
            <Link
              href="/dashboard/budget"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D5A47] hover:underline"
            >
              <span>{t.common.viewAll}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
                <span>{t.overview.totalIncome}</span>
                <TrendingUp className="h-4 w-4 text-[#2D5A47]" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#2D5A47]">
                {loadingData ? "—" : formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
                <span>{t.overview.totalExpenses}</span>
                <TrendingDown className="h-4 w-4 text-[#C86D51]" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#C86D51]">
                {loadingData ? "—" : formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
                <span>{t.overview.netBalance}</span>
                <Scale className="h-4 w-4 text-[#57534E]" />
              </div>
              <p
                className={`mt-2 font-display text-2xl font-bold tabular-nums ${
                  netBalance >= 0 ? "text-[#1C1917]" : "text-[#C86D51]"
                }`}
              >
                {loadingData ? "—" : formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Family Hub Core Modules: Shared Calendar + Family Pulse Feed */}
      {(moduleSettings.show_calendar || moduleSettings.show_family_feed) && (
        <div
          className={`grid gap-6 ${
            moduleSettings.show_calendar && moduleSettings.show_family_feed
              ? "lg:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {/* Shared Calendar Widget */}
          {moduleSettings.show_calendar && (
            <section className="surface-card flex flex-col rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4.5 w-4.5 text-[#2D5A47]" />
                  <h2 className="font-display text-base font-bold text-[#1C1917]">
                    {t.overview.upcomingEvents}
                  </h2>
                </div>
                <Link
                  href="/dashboard/calendar"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D5A47] hover:underline"
                >
                  <span>{t.common.viewAll}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 flex-1">
                {loadingData ? (
                  <div className="flex h-36 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#78716C]" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-4 text-center">
                    <p className="text-sm text-[#6B655E]">
                      {t.overview.noUpcomingEvents}
                    </p>
                    <Link
                      href="/dashboard/calendar"
                      className="mt-3 text-xs font-semibold text-[#2D5A47] hover:underline"
                    >
                      + {t.overview.addEvent}
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#EFEAE2]">
                    {upcomingEvents.map((event) => {
                      const dotColor = resolveCategoryColor(
                        event.category,
                        event.category_color
                      );
                      const categoryLabel =
                        t.calendar.categories[event.category.toLowerCase()] ??
                        event.category;

                      return (
                        <li
                          key={event.id}
                          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: dotColor }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1C1917]">
                                {event.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[#6B655E]">
                                {formatDate(event.start_time, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                · {formatTime(event.start_time)}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#E7E1D8] bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-medium text-[#1C1917]">
                            {categoryLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}

          {/* Family Pulse Private Social Feed Widget */}
          {moduleSettings.show_family_feed && (
            <section className="surface-card flex flex-col rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#C86D51]" />
                  <h2 className="font-display text-base font-bold text-[#1C1917]">
                    {t.overview.familyPulseHeading}
                  </h2>
                </div>
                <Link
                  href="/dashboard/memories"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D5A47] hover:underline"
                >
                  <span>{t.common.viewAll}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 flex-1">
                {loadingData ? (
                  <div className="flex h-36 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#78716C]" />
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-4 text-center">
                    <p className="text-sm text-[#6B655E]">
                      {t.overview.noRecentMemories}
                    </p>
                    <Link
                      href="/dashboard/memories"
                      className="mt-3 text-xs font-semibold text-[#2D5A47] hover:underline"
                    >
                      + {t.overview.logMemory}
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentPosts.map((post) => {
                      const authorName = post.author_id
                        ? memberMap.get(post.author_id)
                        : t.common.unknownMember;
                      return (
                        <li
                          key={post.id}
                          className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/70 p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6B655E]">
                              {post.post_type === "youtube" && (
                                <PlayCircle className="h-3.5 w-3.5 text-[#C86D51]" />
                              )}
                              {post.post_type === "milestone" && (
                                <Trophy className="h-3.5 w-3.5 text-[#B8862D]" />
                              )}
                              <span>
                                {t.feed.postTypes[post.post_type]} ·{" "}
                                {authorName}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-[#78716C]">
                              {formatDate(post.activity_date)}
                            </span>
                          </div>
                          <h3 className="mt-1 truncate text-sm font-semibold text-[#1C1917]">
                            {post.title}
                          </h3>
                          {post.body && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#57534E]">
                              {post.body}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Private My Space Callout */}
      <section className="surface-card flex flex-col justify-between gap-4 rounded-2xl border-[#EBDAD3] bg-gradient-to-r from-white via-white to-[#FBF5F2] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBF0EC] text-[#C86D51]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold text-[#1C1917]">
                {t.overview.mySpaceCalloutTitle}
              </h2>
              <span className="rounded-full bg-[#FBF0EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#9A4B33]">
                {t.common.privateBadge}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#57534E] sm:text-sm">
              {t.overview.mySpaceCalloutDesc}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/my-space"
          className="btn-primary shrink-0 self-start sm:self-center"
        >
          <span>{t.overview.mySpaceCalloutButton}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
