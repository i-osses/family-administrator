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
  Lock,
  Plus,
  Repeat,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { COLOR_SWATCHES, resolveCategoryColor } from "@/lib/constants";
import type {
  CalendarEvent,
  CalendarRecurrenceRule,
  CalendarVisibility,
  FamilyCalendarCategory,
} from "@/types/database";

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

interface CalendarOccurrence {
  occurrenceKey: string;
  event: CalendarEvent;
  start: Date;
  end: Date;
}

function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarOccurrence[] {
  const result: CalendarOccurrence[] = [];

  for (const event of events) {
    const baseStart = new Date(event.start_time);
    const baseEnd = new Date(event.end_time);
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());
    const rule: CalendarRecurrenceRule = event.recurrence_rule ?? "none";

    if (rule === "none") {
      if (baseEnd >= rangeStart && baseStart <= rangeEnd) {
        result.push({
          occurrenceKey: `${event.id}_${toDateKey(baseStart)}`,
          event,
          start: baseStart,
          end: baseEnd,
        });
      }
      continue;
    }

    const hardEnd = event.recurrence_end_date
      ? (() => {
          const [y, m, d] = event.recurrence_end_date.split("-").map(Number);
          const endDate = new Date(y, m - 1, d, 23, 59, 59);
          return endDate < rangeEnd ? endDate : rangeEnd;
        })()
      : rangeEnd;

    if (baseStart > hardEnd) continue;

    const firstDay = new Date(
      Math.max(
        new Date(
          baseStart.getFullYear(),
          baseStart.getMonth(),
          baseStart.getDate()
        ).getTime(),
        new Date(
          rangeStart.getFullYear(),
          rangeStart.getMonth(),
          rangeStart.getDate()
        ).getTime()
      )
    );

    if (rule === "daily") {
      const cursor = new Date(firstDay);
      let guard = 0;
      while (cursor <= hardEnd && guard < 90) {
        const occStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          baseStart.getHours(),
          baseStart.getMinutes()
        );
        if (occStart >= baseStart && occStart <= hardEnd) {
          result.push({
            occurrenceKey: `${event.id}_${toDateKey(occStart)}`,
            event,
            start: occStart,
            end: new Date(occStart.getTime() + durationMs),
          });
        }
        cursor.setDate(cursor.getDate() + 1);
        guard++;
      }
    } else if (rule === "weekly") {
      const allowedDays =
        event.recurrence_days && event.recurrence_days.length > 0
          ? new Set(event.recurrence_days)
          : new Set([baseStart.getDay()]);

      const cursor = new Date(firstDay);
      let guard = 0;
      while (cursor <= hardEnd && guard < 90) {
        if (allowedDays.has(cursor.getDay())) {
          const occStart = new Date(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
            baseStart.getHours(),
            baseStart.getMinutes()
          );
          if (occStart >= baseStart && occStart <= hardEnd) {
            result.push({
              occurrenceKey: `${event.id}_${toDateKey(occStart)}`,
              event,
              start: occStart,
              end: new Date(occStart.getTime() + durationMs),
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
        guard++;
      }
    } else if (rule === "monthly") {
      const targetDay = baseStart.getDate();
      let cursorYear = firstDay.getFullYear();
      let cursorMonth = firstDay.getMonth();
      let guard = 0;
      while (guard < 6) {
        const lastDayOfMonth = new Date(
          cursorYear,
          cursorMonth + 1,
          0
        ).getDate();
        const clampedDay = Math.min(targetDay, lastDayOfMonth);
        const occStart = new Date(
          cursorYear,
          cursorMonth,
          clampedDay,
          baseStart.getHours(),
          baseStart.getMinutes()
        );
        if (occStart > hardEnd) break;
        if (occStart >= baseStart && occStart >= rangeStart) {
          result.push({
            occurrenceKey: `${event.id}_${toDateKey(occStart)}`,
            event,
            start: occStart,
            end: new Date(occStart.getTime() + durationMs),
          });
        }
        cursorMonth++;
        if (cursorMonth > 11) {
          cursorMonth = 0;
          cursorYear++;
        }
        guard++;
      }
    }
  }

  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export default function CalendarPage() {
  const { t, tv, locale, formatDate, formatTime } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, loadingFamilies } = useFamily();

  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() =>
    toDateKey(today)
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | CalendarVisibility
  >("all");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<FamilyCalendarCategory[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Event Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<string>("Family");
  const [visibility, setVisibility] = useState<CalendarVisibility>("family");
  const [recurrenceRule, setRecurrenceRule] =
    useState<CalendarRecurrenceRule>("none");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom Categories Modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<string>(COLOR_SWATCHES[0]);
  const [savingCat, setSavingCat] = useState(false);

  const rangeBounds = useMemo(() => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    start.setDate(start.getDate() - 7);
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    end.setDate(end.getDate() + 7);
    return { start, end };
  }, [currentMonth]);

  const loadCalendarData = useCallback(async () => {
    await Promise.resolve();
    if (!activeFamily) {
      setEvents([]);
      setCategories([]);
      return;
    }

    setLoadingEvents(true);
    try {
      const supabase = createClient();
      const [eventsRes, catsRes] = await Promise.all([
        supabase
          .from("calendar_events")
          .select("*")
          .eq("family_id", activeFamily.id)
          .lte("start_time", rangeBounds.end.toISOString())
          .order("start_time", { ascending: true }),
        supabase
          .from("family_calendar_categories")
          .select("*")
          .eq("family_id", activeFamily.id)
          .order("name", { ascending: true }),
      ]);

      if (!eventsRes.error) {
        setEvents((eventsRes.data as CalendarEvent[]) ?? []);
      }
      if (!catsRes.error) {
        setCategories((catsRes.data as FamilyCalendarCategory[]) ?? []);
      }
    } finally {
      setLoadingEvents(false);
    }
  }, [activeFamily, rangeBounds.end]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCalendarData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCalendarData]);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.name.toLowerCase(), c.color);
    }
    return map;
  }, [categories]);

  const getEventColor = useCallback(
    (ev: CalendarEvent) =>
      categoryColorMap.get(ev.category.toLowerCase()) ??
      resolveCategoryColor(ev.category, ev.category_color),
    [categoryColorMap]
  );

  // Expand recurring events across displayed month grid range
  const expandedOccurrences = useMemo(() => {
    const all = expandEventsForRange(events, rangeBounds.start, rangeBounds.end);
    return all.filter(({ event }) => {
      if (
        categoryFilter !== "all" &&
        event.category.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      const evVis: CalendarVisibility = event.visibility ?? "family";
      if (visibilityFilter !== "all" && evVis !== visibilityFilter) {
        return false;
      }
      return true;
    });
  }, [events, rangeBounds, categoryFilter, visibilityFilter]);

  const monthAgendaOccurrences = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    return expandedOccurrences.filter(
      (occ) => occ.end >= monthStart && occ.start <= monthEnd
    );
  }, [expandedOccurrences, currentMonth]);

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, CalendarOccurrence[]>();
    for (const occ of expandedOccurrences) {
      const cursor = new Date(
        occ.start.getFullYear(),
        occ.start.getMonth(),
        occ.start.getDate()
      );
      const lastDay = new Date(
        occ.end.getFullYear(),
        occ.end.getMonth(),
        occ.end.getDate()
      );
      let guard = 0;
      while (cursor <= lastDay && guard < 35) {
        const key = toDateKey(cursor);
        const list = map.get(key) ?? [];
        list.push(occ);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
        guard++;
      }
    }
    return map;
  }, [expandedOccurrences]);

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

  const openCreateModal = (dateKey?: string) => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setCategory(categories[0]?.name ?? "Family");
    setVisibility("family");
    setRecurrenceRule("none");
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
    setRecurrenceDays([baseDate.getDay()]);
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? "");
    const startDate = new Date(event.start_time);
    setStartTime(toLocalDateTimeInput(startDate));
    setEndTime(toLocalDateTimeInput(new Date(event.end_time)));
    setCategory(event.category);
    setVisibility(event.visibility ?? "family");
    setRecurrenceRule(event.recurrence_rule ?? "none");
    setRecurrenceDays(
      event.recurrence_days && event.recurrence_days.length > 0
        ? event.recurrence_days
        : [startDate.getDay()]
    );
    setShareToFeed(false);
    setModalOpen(true);
  };

  const toggleWeekday = (dayIndex: number) => {
    setRecurrenceDays((prev) => {
      if (prev.includes(dayIndex)) {
        const next = prev.filter((d) => d !== dayIndex);
        return next.length > 0 ? next : [dayIndex];
      }
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
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

    const chosenColor =
      categoryColorMap.get(category.toLowerCase()) ??
      resolveCategoryColor(category);

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        title: title.trim(),
        description: description.trim() || null,
        start_time: startIso.toISOString(),
        end_time: endIso.toISOString(),
        category: category.trim() || "Family",
        category_color: chosenColor,
        visibility,
        recurrence_rule: recurrenceRule,
        recurrence_days:
          recurrenceRule === "weekly" ? recurrenceDays : [],
        assigned_to: null,
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

        if (shareToFeed && visibility === "family" && createdEvent) {
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
            tags: [category.toLowerCase()],
            calendar_event_id: createdEvent.id,
          });
        }

        showToast(t.calendar.eventCreatedToast, "success");
      }

      setModalOpen(false);
      await loadCalendarData();
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
    await loadCalendarData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !newCatName.trim()) return;
    setSavingCat(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("family_calendar_categories")
        .insert({
          family_id: activeFamily.id,
          name: newCatName.trim(),
          color: newCatColor,
          created_by: profile.id,
        });
      if (error) throw error;
      setNewCatName("");
      showToast(tv.calendarExt.categoryAddedToast, "success");
      await loadCalendarData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: FamilyCalendarCategory) => {
    if (!window.confirm(tv.calendarExt.confirmDeleteCategory)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("family_calendar_categories")
      .delete()
      .eq("id", cat.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (categoryFilter.toLowerCase() === cat.name.toLowerCase()) {
      setCategoryFilter("all");
    }
    showToast(tv.calendarExt.categoryDeletedToast, "success");
    await loadCalendarData();
  };

  const monthHeading = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const todayKey = toDateKey(today);
  const selectedDayOccurrences = occurrencesByDay.get(selectedDayKey) ?? [];

  const availableCategoryNames = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({ name: c.name, color: c.color }));
    }
    return [
      { name: "Family", color: "#2D5A47" },
      { name: "School", color: "#3B6998" },
      { name: "Church", color: "#9E4F73" },
      { name: "Activities", color: "#C86D51" },
    ];
  }, [categories]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.calendar.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.calendar.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="manage-calendar-categories-btn"
            onClick={() => setCatModalOpen(true)}
            className="btn-secondary text-xs sm:text-sm"
          >
            <Tag className="h-4 w-4 text-[#2D5A47]" />
            <span>{tv.calendarExt.manageCategories}</span>
          </button>
          <button
            type="button"
            id="new-calendar-event-btn"
            onClick={() => openCreateModal(selectedDayKey)}
            className="btn-primary text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t.calendar.newEvent}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="surface-card space-y-3 rounded-2xl p-4">
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
            <h2 className="min-w-[140px] text-center font-display text-sm font-bold capitalize text-[#1C1917] sm:text-base">
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
              className="rounded-xl border border-[#DFD8CE] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#57534E] transition hover:bg-[#F5F2EC] cursor-pointer"
            >
              {t.common.today}
            </button>
          </div>

          {/* Visibility Filter + View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-xs font-semibold">
              {(
                [
                  { id: "all" as const, label: tv.calendarExt.visibilityAll },
                  {
                    id: "family" as const,
                    label: tv.calendarExt.visibilityFamily,
                  },
                  {
                    id: "private" as const,
                    label: tv.calendarExt.visibilityPrivate,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibilityFilter(opt.id)}
                  className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                    visibilityFilter === opt.id
                      ? "bg-white text-[#1C1917] shadow-2xs"
                      : "text-[#6B655E]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-xs font-semibold">
              <button
                type="button"
                id="calendar-view-month"
                onClick={() => setViewMode("month")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  viewMode === "month"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{t.calendar.monthView}</span>
              </button>
              <button
                type="button"
                id="calendar-view-agenda"
                onClick={() => setViewMode("agenda")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  viewMode === "agenda"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>{t.calendar.agendaView}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              categoryFilter === "all"
                ? "bg-[#1C1917] text-white"
                : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
            }`}
          >
            {t.calendar.allCategories}
          </button>
          {availableCategoryNames.map((cat) => {
            const active =
              categoryFilter.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() =>
                  setCategoryFilter(active ? "all" : cat.name)
                }
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? "border-[#1C1917] bg-[#1C1917] text-white"
                    : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
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
                const dayItems = occurrencesByDay.get(day.key) ?? [];
                const isToday = day.key === todayKey;
                const isSelected = day.key === selectedDayKey;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    className={`flex min-h-[76px] flex-col items-start p-1.5 text-left transition sm:min-h-[96px] sm:p-2 cursor-pointer ${
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
                    {dayItems.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                        {dayItems.slice(0, 4).map((occ) => (
                          <span
                            key={occ.occurrenceKey}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: getEventColor(occ.event) }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Desktop pills */}
                    <div className="mt-1 hidden w-full space-y-1 sm:block">
                      {dayItems.slice(0, 2).map((occ) => {
                        const color = getEventColor(occ.event);
                        return (
                          <div
                            key={occ.occurrenceKey}
                            className="truncate rounded-md border-l-2 bg-[#FAF8F5] px-1.5 py-0.5 text-[10px] font-medium text-[#1C1917]"
                            style={{ borderLeftColor: color }}
                          >
                            {occ.event.title}
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <p className="px-1 text-[10px] font-semibold text-[#6B655E]">
                          +{dayItems.length - 2}
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
              {selectedDayOccurrences.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-4 text-center">
                  <p className="text-sm text-[#6B655E]">
                    {t.calendar.noEventsSelectedDay}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedDayOccurrences.map((occ) => {
                    const ev = occ.event;
                    const color = getEventColor(ev);
                    const isPrivate = ev.visibility === "private";
                    const rule = ev.recurrence_rule ?? "none";

                    return (
                      <li
                        key={occ.occurrenceKey}
                        className="rounded-xl border border-[#EFEAE2] border-l-4 bg-[#FAF8F5]/60 p-3.5"
                        style={{ borderLeftColor: color }}
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

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6B655E]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(occ.start)} – {formatTime(occ.end)}
                          </span>
                          {rule !== "none" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#57534E] ring-1 ring-[#E7E1D8]">
                              <Repeat className="h-2.5 w-2.5" />
                              {tv.calendarExt.repeatsBadge[rule]}
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
                            {ev.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#1C1917] ring-1 ring-[#E7E1D8]">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {ev.category}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isPrivate
                                ? "bg-[#FBF0EC] text-[#9A4B33]"
                                : "bg-[#E9F2EE] text-[#234738]"
                            }`}
                          >
                            {isPrivate ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {isPrivate
                              ? tv.calendarExt.visibilityPrivate
                              : tv.calendarExt.visibilityFamily}
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
          {monthAgendaOccurrences.length === 0 ? (
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
              {monthAgendaOccurrences.map((occ) => {
                const ev = occ.event;
                const color = getEventColor(ev);
                const isPrivate = ev.visibility === "private";
                const rule = ev.recurrence_rule ?? "none";

                return (
                  <li
                    key={occ.occurrenceKey}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] py-1.5 text-center">
                        <span className="text-[10px] font-semibold tracking-wide text-[#78716C] uppercase">
                          {formatDate(occ.start, { month: "short" })}
                        </span>
                        <span className="font-display text-lg font-bold leading-tight text-[#1C1917]">
                          {occ.start.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1C1917]">
                            {ev.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-medium text-[#1C1917] ring-1 ring-[#E7E1D8]">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {ev.category}
                          </span>
                          {rule !== "none" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#57534E]">
                              <Repeat className="h-2.5 w-2.5" />
                              {tv.calendarExt.repeatsBadge[rule]}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#6B655E]">
                          {formatDate(occ.start, { weekday: "long" })} ·{" "}
                          {formatTime(occ.start)} – {formatTime(occ.end)}
                        </p>
                        {ev.description && (
                          <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isPrivate
                            ? "bg-[#FBF0EC] text-[#9A4B33]"
                            : "bg-[#E9F2EE] text-[#234738]"
                        }`}
                      >
                        {isPrivate ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {isPrivate
                          ? tv.calendarExt.visibilityPrivate
                          : tv.calendarExt.visibilityFamily}
                      </span>
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

      {/* Zero-Scroll Compact Create / Edit Event Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? t.calendar.editEvent : t.calendar.newEvent}
      >
        <form
          onSubmit={handleSaveEvent}
          className="box-border w-full max-w-full min-w-0 space-y-2.5"
        >
          {/* Title */}
          <div className="min-w-0">
            <input
              id="event-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calendar.eventTitlePlaceholder}
              aria-label={t.calendar.eventTitleLabel}
              className="input-base py-2"
            />
          </div>

          {/* Visibility Toggle (Family Calendar vs. Private My Space) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F0EA] p-1">
            <button
              type="button"
              onClick={() => setVisibility("family")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                visibility === "family"
                  ? "bg-white text-[#234738] shadow-xs"
                  : "text-[#6B655E]"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="truncate">
                {tv.calendarExt.visibilityFamily}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                visibility === "private"
                  ? "bg-white text-[#9A4B33] shadow-xs"
                  : "text-[#6B655E]"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="truncate">
                {tv.calendarExt.visibilityPrivate}
              </span>
            </button>
          </div>

          {/* Horizontal Pill Selector for Custom Categories */}
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#57534E]">
                {t.calendar.categoryLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setCatModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#2D5A47] hover:underline cursor-pointer"
              >
                + {tv.calendarExt.manageCategories}
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {availableCategoryNames.map((cat) => {
                const selected =
                  category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      selected
                        ? "border-[#1C1917] bg-[#1C1917] text-white"
                        : "border-[#E7E1D8] bg-[#FAF8F5] text-[#57534E]"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Start & End Date/Time Pickers */}
          <div className="grid w-full max-w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="event-start-input"
                className="mb-0.5 block text-[11px] font-semibold text-[#57534E]"
              >
                {t.calendar.startTimeLabel}
              </label>
              <input
                id="event-start-input"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border py-1.5"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="event-end-input"
                className="mb-0.5 block text-[11px] font-semibold text-[#57534E]"
              >
                {t.calendar.endTimeLabel}
              </label>
              <input
                id="event-end-input"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border py-1.5"
              />
            </div>
          </div>

          {/* Repeat Rule Pill Selector */}
          <div className="min-w-0">
            <span className="mb-1 block text-[11px] font-semibold text-[#57534E]">
              {tv.calendarExt.repeatLabel}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                ["none", "daily", "weekly", "monthly"] as CalendarRecurrenceRule[]
              ).map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => setRecurrenceRule(rule)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    recurrenceRule === rule
                      ? "border-[#2D5A47] bg-[#E9F2EE] text-[#234738]"
                      : "border-[#E7E1D8] bg-white text-[#57534E]"
                  }`}
                >
                  {tv.calendarExt.repeatsBadge[rule]}
                </button>
              ))}
            </div>

            {recurrenceRule === "weekly" && (
              <div className="mt-2 flex items-center justify-between gap-1">
                {tv.calendarExt.weekdayLetters.map((letter, idx) => {
                  const selected = recurrenceDays.includes(idx);
                  return (
                    <button
                      key={`${letter}-${idx}`}
                      type="button"
                      onClick={() => toggleWeekday(idx)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition cursor-pointer ${
                        selected
                          ? "bg-[#2D5A47] text-white"
                          : "bg-[#F4F0EA] text-[#57534E]"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compact Details Input */}
          <div className="min-w-0">
            <input
              id="event-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`${t.calendar.descriptionPlaceholder} (${t.common.optional})`}
              aria-label={t.calendar.descriptionLabel}
              className="input-base py-2"
            />
          </div>

          {/* Optional Share to Family Pulse (only for shared family events) */}
          {!editingEvent && visibility === "family" && (
            <label className="flex items-center gap-2 rounded-xl bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-[#D5CDC1] accent-[#2D5A47]"
              />
              <span className="truncate">{t.calendar.shareToFeedLabel}</span>
            </label>
          )}

          {/* Action Row */}
          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-1 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary w-full py-2 sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-2 sm:w-auto"
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

      {/* Custom Calendar Categories Manager Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={tv.calendarExt.manageCategories}
      >
        <div className="space-y-3">
          <form onSubmit={handleCreateCategory} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={tv.calendarExt.newCategoryPlaceholder}
                className="input-base flex-1 py-2"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="btn-primary shrink-0 py-2"
              >
                {savingCat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  tv.calendarExt.addCategory
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewCatColor(hex)}
                  aria-label={`Color ${hex}`}
                  className={`h-6 w-6 rounded-full transition cursor-pointer ${
                    newCatColor === hex
                      ? "ring-2 ring-[#1C1917] ring-offset-2"
                      : ""
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </form>

          <div className="max-h-56 divide-y divide-[#EFEAE2] overflow-y-auto rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] px-3">
            {categories.length === 0 ? (
              <p className="py-5 text-center text-xs text-[#6B655E]">
                {tv.calendarExt.noCategoriesYet}
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 py-2.5"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCategory(cat)}
                    className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
