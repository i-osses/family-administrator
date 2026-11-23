"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  BookHeart,
  Wallet,
  Users,
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Avatar } from "@/components/ui/Avatar";
import {
  DEFAULT_BANNER_URL,
  getCalendarCategoryStyle,
} from "@/lib/constants";
import type {
  ActivityMemory,
  BudgetEntry,
  CalendarEvent,
} from "@/types/database";

export default function DashboardOverviewPage() {
  const { t, formatCurrency, formatDate, formatTime } = useLanguage();
  const { profile, activeFamily, members, loadingFamilies } = useFamily();

  const [loadingData, setLoadingData] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentMemories, setRecentMemories] = useState<ActivityMemory[]>([]);
  const [monthEntries, setMonthEntries] = useState<BudgetEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadOverview = async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!activeFamily) {
        setUpcomingEvents([]);
        setRecentMemories([]);
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

        const [eventsRes, memoriesRes, budgetRes] = await Promise.all([
          supabase
            .from("calendar_events")
            .select("*")
            .eq("family_id", activeFamily.id)
            .gte("end_time", now.toISOString())
            .order("start_time", { ascending: true })
            .limit(5),
          supabase
            .from("activity_memories")
            .select("*")
            .eq("family_id", activeFamily.id)
            .order("activity_date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("budget_entries")
            .select("*")
            .eq("family_id", activeFamily.id)
            .gte("entry_date", startOfMonth)
            .lte("entry_date", endOfMonth),
        ]);

        if (cancelled) return;
        setUpcomingEvents((eventsRes.data as CalendarEvent[]) ?? []);
        setRecentMemories((memoriesRes.data as ActivityMemory[]) ?? []);
        setMonthEntries((budgetRes.data as BudgetEntry[]) ?? []);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [activeFamily]);

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

        {/* Quick Actions Bar */}
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
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF0EC] text-[#C86D51]">
              <BookHeart className="h-4 w-4" />
            </span>
            <span className="truncate">{t.overview.logMemory}</span>
          </Link>
          <Link
            href="/dashboard/budget"
            className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF4E6] text-[#9E7022]">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="truncate">{t.overview.addTransaction}</span>
          </Link>
          <Link
            href="/dashboard/family"
            className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAF8F5]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F2EE] text-[#2D5A47]">
              <Users className="h-4 w-4" />
            </span>
            <span className="truncate">{t.overview.manageFamily}</span>
          </Link>
        </div>
      </section>

      {/* Monthly Budget Snapshot */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#1C1917]">
            {t.overview.monthlyBudget}
          </h2>
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

      {/* Two-Column Overview: Upcoming Events + Recent Memories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
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
                  const style = getCalendarCategoryStyle(event.category);
                  const assigneeName = event.assigned_to
                    ? memberMap.get(event.assigned_to)
                    : t.common.everyone;

                  return (
                    <li
                      key={event.id}
                      className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dotClass}`}
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
                            {assigneeName ? ` · ${assigneeName}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badgeClass}`}
                      >
                        {t.calendar.categories[event.category]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Recent Memories */}
        <section className="surface-card flex flex-col rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookHeart className="h-4.5 w-4.5 text-[#C86D51]" />
              <h2 className="font-display text-base font-bold text-[#1C1917]">
                {t.overview.recentMemories}
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
            ) : recentMemories.length === 0 ? (
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
                {recentMemories.map((memory) => (
                  <li
                    key={memory.id}
                    className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/70 p-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-[#1C1917]">
                        {memory.title}
                      </h3>
                      <span className="shrink-0 text-xs text-[#78716C]">
                        {formatDate(memory.activity_date)}
                      </span>
                    </div>
                    {memory.notes && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#57534E]">
                        {memory.notes}
                      </p>
                    )}
                    {memory.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {memory.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#57534E] ring-1 ring-[#E7E1D8]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
