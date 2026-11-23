"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  List,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/ToastProvider";
import {
  CALENDAR_CATEGORIES,
  getCalendarCategoryStyle,
} from "@/lib/constants";
import type { CalendarCategory, CalendarEvent } from "@/types/database";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function toLocalDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export default function CalendarPage() {
  const { t, locale, formatDate, formatTime } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, members, loadingFamilies } = useFamily();

  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() =>
    toDateKey(today)
  );
  const [categoryFilter, setCategoryFilter] = useState<
    CalendarCategory | "all"
  >("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("family");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!activeFamily) {
      setEvents([]);
      return;
    }

    setLoadingEvents(true);
    try {
      const supabase = createClient();
      const rangeStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      rangeStart.setDate(rangeStart.getDate() - 7);

      const rangeEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      rangeEnd.setDate(rangeEnd.getDate() + 7);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("family_id", activeFamily.id)
        .gte("end_time", rangeStart.toISOString())
        .lte("start_time", rangeEnd.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Failed to fetch events:", error.message);
        return;
      }

      setEvents((data as CalendarEvent[]) ?? []);
    } finally {
      setLoadingEvents(false);
    }
  }, [activeFamily, currentMonth]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }
      if (memberFilter === "unassigned" && event.assigned_to !== null) {
        return false;
      }
      if (
        memberFilter !== "all" &&
        memberFilter !== "unassigned" &&
        event.assigned_to !== memberFilter
      ) {
        return false;
      }
      return true;
    });
  }, [events, categoryFilter, memberFilter]);

  // Events occurring within the active month (for Agenda view)
  const monthAgendaEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return filteredEvents.filter((event) => {
      const s = new Date(event.start_time);
      const e = new Date(event.end_time);
      return e >= monthStart && s <= monthEnd;
    });
  }, [filteredEvents, currentMonth]);

  // Map day keys (YYYY-MM-DD) -> events
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      const cursor = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const lastDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );
      let guard = 0;
      while (cursor <= lastDay && guard < 45) {
        const key = toDateKey(cursor);
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
        guard++;
      }
    }
    return map;
  }, [filteredEvents]);

  // Build 42-day grid for currentMonth
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    const days: { date: Date; key: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i
      );
      days.push({
        date: d,
        key: toDateKey(d),
        inMonth: d.getMonth() === month,
      });
    }
    return days;
  }, [currentMonth]);

  const memberLookup = useMemo(() => {
    const map = new Map<
      string,
      { name: string; avatar: string | null }
    >();
    for (const m of members) {
      map.set(m.user_id, {
        name:
          m.profile?.full_name || m.profile?.email || t.common.unknownMember,
        avatar: m.profile?.avatar_url ?? null,
      });
    }
    return map;
  }, [members, t.common.unknownMember]);

  const openCreateModal = (dateKey?: string) => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setCategory("family");
    setAssignedTo("");
    setShareToFeed(false);

    const baseDate = dateKey
      ? (() => {
          const [y, m, d] = dateKey.split("-").map(Number);
          return new Date(y, m - 1, d, 10, 0);
        })()
      : new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          10,
          0
        );
    const endDate = new Date(baseDate.getTime() + 60 * 60 * 1000);
    setStartTime(toLocalDateTimeInput(baseDate));
    setEndTime(toLocalDateTimeInput(endDate));
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? "");
    setStartTime(toLocalDateTimeInput(new Date(event.start_time)));
    setEndTime(toLocalDateTimeInput(new Date(event.end_time)));
    setCategory(event.category);
    setAssignedTo(event.assigned_to ?? "");
    setShareToFeed(false);
    setModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !title.trim() || !startTime || !endTime) return;

    const startIso = new Date(startTime);
    const endIso = new Date(endTime);
    if (endIso < startIso) {
      showToast(t.calendar.endBeforeStartError, "error");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        title: title.trim(),
        description: description.trim() || null,
        start_time: startIso.toISOString(),
        end_time: endIso.toISOString(),
        category,
        assigned_to: assignedTo || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("calendar_events")
          .update(payload)
          .eq("id", editingEvent.id);
        if (error) throw error;
        showToast(t.calendar.eventUpdatedToast, "success");
      } else {
        const { data: createdEvent, error } = await supabase
          .from("calendar_events")
          .insert({
            ...payload,
            created_by: profile.id,
          })
          .select("id")
          .single();
        if (error) throw error;

        if (shareToFeed && createdEvent) {
          const eventSummary = [
            `${formatDate(startIso, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} · ${formatTime(startIso)} – ${formatTime(endIso)}`,
            description.trim(),
          ]
            .filter(Boolean)
            .join("\n");

          await supabase.from("family_feed_posts").insert({
            family_id: activeFamily.id,
            author_id: profile.id,
            post_type: "event",
            title: title.trim(),
            body: eventSummary,
            activity_date: toDateKey(startIso),
            tags: [category],
            calendar_event_id: createdEvent.id,
          });
        }

        showToast(t.calendar.eventCreatedToast, "success");
      }

      setModalOpen(false);
      await loadEvents();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm(t.calendar.confirmDeleteEvent)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.calendar.eventDeletedToast, "success");
    await loadEvents();
  };

  const monthHeading = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const todayKey = toDateKey(today);
  const selectedDayEvents = eventsByDay.get(selectedDayKey) ?? [];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.calendar.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.calendar.subtitle}</p>
        </div>

        <button
          type="button"
          id="new-calendar-event-btn"
          onClick={() => openCreateModal(selectedDayKey)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.calendar.newEvent}</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="surface-card space-y-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="rounded-xl border border-[#DFD8CE] bg-white p-2 text-[#57534E] transition hover:bg-[#F5F2EC] cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-[155px] text-center font-display text-base font-bold capitalize text-[#1C1917]">
              {monthHeading}
            </h2>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="rounded-xl border border-[#DFD8CE] bg-white p-2 text-[#57534E] transition hover:bg-[#F5F2EC] cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1)
                );
                setSelectedDayKey(todayKey);
              }}
              className="rounded-xl border border-[#DFD8CE] bg-white px-3 py-1.5 text-xs font-semibold text-[#57534E] transition hover:bg-[#F5F2EC] cursor-pointer"
            >
              {t.common.today}
            </button>
          </div>

          {/* View Switcher + Member Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label={t.calendar.assignedToLabel}
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="rounded-xl border border-[#DFD8CE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] focus:border-[#2D5A47] focus:outline-none"
            >
              <option value="all">{t.calendar.allMembers}</option>
              <option value="unassigned">{t.common.everyone}</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.full_name || m.profile?.email}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-xs font-semibold">
              <button
                type="button"
                id="calendar-view-month"
                onClick={() => setViewMode("month")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  viewMode === "month"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E] hover:text-[#1C1917]"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{t.calendar.monthView}</span>
              </button>
              <button
                type="button"
                id="calendar-view-agenda"
                onClick={() => setViewMode("agenda")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  viewMode === "agenda"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E] hover:text-[#1C1917]"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>{t.calendar.agendaView}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              categoryFilter === "all"
                ? "bg-[#1C1917] text-white"
                : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
            }`}
          >
            {t.calendar.allCategories}
          </button>
          {CALENDAR_CATEGORIES.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? `${cat.badgeClass} font-semibold`
                    : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${cat.dotClass}`} />
                <span>{t.calendar.categories[cat.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calendar Body */}
      {loadingEvents ? (
        <div className="surface-card flex h-72 items-center justify-center rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
        </div>
      ) : viewMode === "month" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Monthly Grid */}
          <div className="surface-card overflow-hidden rounded-2xl lg:col-span-8">
            <div className="grid grid-cols-7 border-b border-[#EFEAE2] bg-[#FAF8F5] text-center text-xs font-semibold text-[#6B655E]">
              {t.calendar.weekdaysShort.map((dayName) => (
                <div key={dayName} className="py-2.5">
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[#EFEAE2]">
              {calendarDays.map((day) => {
                const dayEvents = eventsByDay.get(day.key) ?? [];
                const isToday = day.key === todayKey;
                const isSelected = day.key === selectedDayKey;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    className={`group flex min-h-[78px] flex-col items-start p-1.5 text-left transition sm:min-h-[96px] sm:p-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#E9F2EE]/55 ring-1 ring-inset ring-[#2D5A47]"
                        : day.inMonth
                          ? "bg-white hover:bg-[#FAF8F5]"
                          : "bg-[#FAF8F5]/60 text-[#A8A29E]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-[#2D5A47] text-white"
                          : day.inMonth
                            ? "text-[#1C1917]"
                            : "text-[#A8A29E]"
                      }`}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Mobile dots */}
                    {dayEvents.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              getCalendarCategoryStyle(ev.category).dotClass
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Desktop event pills */}
                    <div className="mt-1 hidden w-full space-y-1 sm:block">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const style = getCalendarCategoryStyle(ev.category);
                        return (
                          <div
                            key={ev.id}
                            className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${style.badgeClass}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <p className="px-1 text-[10px] font-semibold text-[#6B655E]">
                          +{dayEvents.length - 2}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Panel */}
          <aside className="surface-card flex flex-col rounded-2xl p-5 lg:col-span-4">
            <div className="flex items-start justify-between gap-2 border-b border-[#EFEAE2] pb-3.5">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#78716C] uppercase">
                  {t.calendar.eventsForDay}
                </p>
                <h3 className="mt-0.5 font-display text-base font-bold text-[#1C1917]">
                  {formatDate(selectedDayKey, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(selectedDayKey)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#E9F2EE] px-2.5 py-1.5 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.calendar.addForDay}</span>
              </button>
            </div>

            <div className="mt-4 flex-1">
              {selectedDayEvents.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-4 text-center">
                  <p className="text-sm text-[#6B655E]">
                    {t.calendar.noEventsSelectedDay}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedDayEvents.map((ev) => {
                    const style = getCalendarCategoryStyle(ev.category);
                    const assignee = ev.assigned_to
                      ? memberLookup.get(ev.assigned_to)
                      : null;

                    return (
                      <li
                        key={ev.id}
                        className={`rounded-xl border border-[#EFEAE2] border-l-4 ${style.borderClass} bg-[#FAF8F5]/60 p-3.5`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#1C1917]">
                            {ev.title}
                          </h4>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(ev)}
                              className="rounded-md p-1 text-[#78716C] transition hover:bg-white hover:text-[#1C1917] cursor-pointer"
                              aria-label={t.common.edit}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteEvent(ev.id)}
                              className="rounded-md p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                              aria-label={t.common.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6B655E]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(ev.start_time)} –{" "}
                            {formatTime(ev.end_time)}
                          </span>
                        </div>

                        {ev.description && (
                          <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
                            {ev.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badgeClass}`}
                          >
                            {t.calendar.categories[ev.category]}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#57534E]">
                            {assignee ? (
                              <>
                                <Avatar
                                  src={assignee.avatar}
                                  name={assignee.name}
                                  size="xs"
                                />
                                <span>{assignee.name}</span>
                              </>
                            ) : (
                              <>
                                <User className="h-3.5 w-3.5 text-[#78716C]" />
                                <span>{t.common.everyone}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      ) : (
        /* Agenda List View */
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          {monthAgendaEvents.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-6 text-center">
              <CalendarDays className="h-8 w-8 text-[#A8A29E]" />
              <p className="mt-3 text-sm font-medium text-[#57534E]">
                {t.calendar.noEventsThisMonth}
              </p>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="btn-primary mt-4 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.calendar.newEvent}</span>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#EFEAE2]">
              {monthAgendaEvents.map((ev) => {
                const style = getCalendarCategoryStyle(ev.category);
                const assignee = ev.assigned_to
                  ? memberLookup.get(ev.assigned_to)
                  : null;

                return (
                  <li
                    key={ev.id}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] py-1.5 text-center">
                        <span className="text-[10px] font-semibold tracking-wide text-[#78716C] uppercase">
                          {formatDate(ev.start_time, { month: "short" })}
                        </span>
                        <span className="font-display text-lg font-bold leading-tight text-[#1C1917]">
                          {new Date(ev.start_time).getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1C1917]">
                            {ev.title}
                          </h3>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badgeClass}`}
                          >
                            {t.calendar.categories[ev.category]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#6B655E]">
                          {formatDate(ev.start_time, { weekday: "long" })} ·{" "}
                          {formatTime(ev.start_time)} –{" "}
                          {formatTime(ev.end_time)}
                        </p>
                        {ev.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-[#57534E]">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#57534E]">
                        {assignee ? (
                          <>
                            <Avatar
                              src={assignee.avatar}
                              name={assignee.name}
                              size="xs"
                            />
                            <span>{assignee.name}</span>
                          </>
                        ) : (
                          <span>{t.common.everyone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                          aria-label={t.common.edit}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEvent(ev.id)}
                          className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                          aria-label={t.common.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? t.calendar.editEvent : t.calendar.newEvent}
      >
        <form
          onSubmit={handleSaveEvent}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          <div className="min-w-0">
            <label
              htmlFor="event-title-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.calendar.eventTitleLabel}
            </label>
            <input
              id="event-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calendar.eventTitlePlaceholder}
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="event-start-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.calendar.startTimeLabel}
              </label>
              <input
                id="event-start-input"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="event-end-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.calendar.endTimeLabel}
              </label>
              <input
                id="event-end-input"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border"
              />
            </div>
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="event-category-select"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.calendar.categoryLabel}
              </label>
              <select
                id="event-category-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CalendarCategory)
                }
                className="input-base"
              >
                {CALENDAR_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t.calendar.categories[cat.id]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                htmlFor="event-assignee-select"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.calendar.assignedToLabel}
              </label>
              <select
                id="event-assignee-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="input-base"
              >
                <option value="">{t.common.everyone}</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile?.full_name || m.profile?.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="event-description-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.calendar.descriptionLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <textarea
              id="event-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.calendar.descriptionPlaceholder}
              className="input-base resize-none"
            />
          </div>

          {!editingEvent && (
            <label className="flex items-start gap-2.5 rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D5CDC1] accent-[#2D5A47]"
              />
              <span className="min-w-0 text-xs">
                <span className="block font-semibold text-[#1C1917]">
                  {t.calendar.shareToFeedLabel}
                </span>
                <span className="mt-0.5 block text-[#6B655E]">
                  {t.calendar.shareToFeedHint}
                </span>
              </span>
            </label>
          )}

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.common.saving}</span>
                </>
              ) : (
                <span>
                  {editingEvent ? t.common.save : t.common.create}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
