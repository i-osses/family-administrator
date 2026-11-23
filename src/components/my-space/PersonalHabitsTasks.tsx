"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Edit3,
  Flame,
  Loader2,
  Lock,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import type {
  HabitCadence,
  HabitCategory,
  HabitKind,
  PersonalHabit,
} from "@/types/database";

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getLast7DateKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

function getWeekStartKey(date: Date): string {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + mondayOffset
  );
  return toDateKey(monday);
}

function computeStreak(
  completedDates: string[],
  cadence: HabitCadence
): number {
  if (completedDates.length === 0) return 0;
  const uniqueSet = new Set(completedDates);
  const now = new Date();

  if (cadence === "weekly") {
    const completedWeeks = new Set(
      completedDates.map((d) => {
        const [y, m, day] = d.split("-").map(Number);
        return getWeekStartKey(new Date(y, m - 1, day));
      })
    );
    let streak = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!completedWeeks.has(getWeekStartKey(cursor))) {
      cursor.setDate(cursor.getDate() - 7);
    }
    while (completedWeeks.has(getWeekStartKey(cursor)) && streak < 520) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    }
    return streak;
  }

  // Daily streak (allows streak to stay alive if checked in yesterday or today)
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!uniqueSet.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (uniqueSet.has(toDateKey(cursor)) && streak < 3650) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const CATEGORY_STYLES: Record<HabitCategory, string> = {
  spiritual: "bg-[#FAF4E6] text-[#855F1C] border-[#EAD9B0]",
  study: "bg-[#EBF2F8] text-[#284D72] border-[#C9DBEB]",
  music: "bg-[#F8ECF2] text-[#7A3555] border-[#E6C7D6]",
  health: "bg-[#E9F2EE] text-[#234738] border-[#C9DED5]",
  personal: "bg-[#FBF0EC] text-[#9A4B33] border-[#F0CFC4]",
  other: "bg-[#F4F2EF] text-[#57534E] border-[#DFDAD3]",
};

export function PersonalHabitsTasks() {
  const { language, t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily } = useFamily();

  const [items, setItems] = useState<PersonalHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState<"all" | HabitKind>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalHabit | null>(null);
  const [kind, setKind] = useState<HabitKind>("habit");
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<HabitCadence>("daily");
  const [category, setCategory] = useState<HabitCategory>("spiritual");
  const [reminderTime, setReminderTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [allowShare, setAllowShare] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const last7Days = useMemo(() => getLast7DateKeys(), []);

  const loadHabits = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("personal_habits")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch personal habits:", error.message);
        return;
      }

      setItems((data as PersonalHabit[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHabits();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHabits]);

  const filteredItems = useMemo(() => {
    if (filterKind === "all") return items;
    return items.filter((item) => item.kind === filterKind);
  }, [items, filterKind]);

  const habitProgress = useMemo(() => {
    const habitsOnly = items.filter((i) => i.kind === "habit");
    const doneToday = habitsOnly.filter((i) =>
      (i.completed_dates ?? []).includes(todayKey)
    ).length;
    return { total: habitsOnly.length, doneToday };
  }, [items, todayKey]);

  const openCreateModal = (defaultKind: HabitKind = "habit") => {
    setEditingItem(null);
    setKind(defaultKind);
    setTitle("");
    setCadence(defaultKind === "task" ? "once" : "daily");
    setCategory(defaultKind === "task" ? "personal" : "spiritual");
    setReminderTime("");
    setDueDate("");
    setPrivateNotes("");
    setAllowShare(false);
    setModalOpen(true);
  };

  const openEditModal = (item: PersonalHabit) => {
    setEditingItem(item);
    setKind(item.kind);
    setTitle(item.title);
    setCadence(item.cadence);
    setCategory(item.category);
    setReminderTime(item.reminder_time ?? "");
    setDueDate(item.due_date ?? "");
    setPrivateNotes(item.private_notes ?? "");
    setAllowShare(item.allow_milestone_share);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        user_id: profile.id,
        title: title.trim(),
        kind,
        cadence: kind === "task" ? "once" : cadence === "once" ? "daily" : cadence,
        category,
        reminder_time: reminderTime || null,
        due_date: kind === "task" ? dueDate || null : null,
        private_notes: privateNotes.trim() || null,
        allow_milestone_share: allowShare,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("personal_habits")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        showToast(t.mySpace.habits.habitUpdatedToast, "success");
      } else {
        const { error } = await supabase
          .from("personal_habits")
          .insert(payload);
        if (error) throw error;
        showToast(t.mySpace.habits.habitSavedToast, "success");
      }

      setModalOpen(false);
      await loadHabits();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHabitCheckIn = async (item: PersonalHabit) => {
    setBusyId(item.id);
    try {
      const supabase = createClient();
      if (item.kind === "task") {
        const nextCompleted = !item.is_completed;
        const { error } = await supabase
          .from("personal_habits")
          .update({ is_completed: nextCompleted })
          .eq("id", item.id);
        if (error) throw error;
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, is_completed: nextCompleted } : row
          )
        );
      } else {
        const currentDates = item.completed_dates ?? [];
        const hasToday = currentDates.includes(todayKey);
        const nextDates = hasToday
          ? currentDates.filter((d) => d !== todayKey)
          : Array.from(new Set([...currentDates, todayKey])).sort();

        const nextStreak = computeStreak(nextDates, item.cadence);
        const nextBest = Math.max(item.best_streak, nextStreak);

        const { error } = await supabase
          .from("personal_habits")
          .update({
            completed_dates: nextDates,
            current_streak: nextStreak,
            best_streak: nextBest,
          })
          .eq("id", item.id);
        if (error) throw error;

        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  completed_dates: nextDates,
                  current_streak: nextStreak,
                  best_streak: nextBest,
                }
              : row
          )
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleShareMilestone = async (item: PersonalHabit) => {
    if (!activeFamily) {
      showToast(t.mySpace.habits.needFamilyToShareError, "error");
      return;
    }

    setSharingId(item.id);
    try {
      const supabase = createClient();
      const unit =
        item.cadence === "weekly"
          ? t.mySpace.habits.weeksUnit
          : t.mySpace.habits.daysUnit;

      const milestoneLabel =
        item.kind === "task"
          ? language === "es"
            ? "Meta personal completada"
            : "Personal goal completed"
          : language === "es"
            ? `Racha de ${Math.max(1, item.current_streak)} ${unit}`
            : `${Math.max(1, item.current_streak)}-${unit.replace(/s$/, "")} streak`;

      const postTitle =
        item.kind === "task"
          ? language === "es"
            ? `Completé: ${item.title}`
            : `Completed: ${item.title}`
          : language === "es"
            ? `${item.title} — ${milestoneLabel}`
            : `${item.title} — ${milestoneLabel}`;

      // Deliberately NEVER includes private_notes or any financial details
      const { error } = await supabase.from("family_feed_posts").insert({
        family_id: activeFamily.id,
        author_id: profile.id,
        post_type: "milestone",
        title: postTitle,
        body: null,
        activity_date: todayKey,
        tags: [item.category, "milestone"],
        milestone_label: milestoneLabel,
      });

      if (error) throw error;
      showToast(t.mySpace.habits.milestoneSharedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSharingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.mySpace.habits.confirmDeleteHabit)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_habits")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.mySpace.habits.habitDeletedToast, "success");
    await loadHabits();
  };

  if (loading) {
    return (
      <div className="surface-card flex h-56 items-center justify-center rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1C1917] sm:text-xl">
            {t.mySpace.habits.heading}
          </h2>
          <p className="mt-0.5 text-xs text-[#57534E] sm:text-sm">
            {t.mySpace.habits.subheading}
          </p>
        </div>

        <button
          type="button"
          id="new-personal-habit-btn"
          onClick={() => openCreateModal("habit")}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.mySpace.habits.newItem}</span>
        </button>
      </div>

      {/* Progress & Filter Bar */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all" as const, label: t.mySpace.habits.filterAll },
              { id: "habit" as const, label: t.mySpace.habits.filterHabits },
              { id: "task" as const, label: t.mySpace.habits.filterTasks },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                filterKind === tab.id
                  ? "bg-[#1C1917] text-white"
                  : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {habitProgress.total > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E9F2EE] px-3 py-1 text-xs font-semibold text-[#234738]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {t.mySpace.habits.todayProgress}:{" "}
              <strong className="tabular-nums">
                {habitProgress.doneToday}/{habitProgress.total}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Habits & Tasks List */}
      {items.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center rounded-3xl p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F2EE] text-[#2D5A47]">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
            {t.mySpace.habits.emptyTitle}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-[#57534E]">
            {t.mySpace.habits.emptySubtitle}
          </p>
          <button
            type="button"
            onClick={() => openCreateModal("habit")}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.mySpace.habits.newItem}</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <p className="text-sm text-[#6B655E]">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => {
            const isHabit = item.kind === "habit";
            const doneToday = isHabit
              ? (item.completed_dates ?? []).includes(todayKey)
              : item.is_completed;
            const isBusy = busyId === item.id;
            const isSharing = sharingId === item.id;
            const canCelebrateNow =
              item.allow_milestone_share &&
              (isHabit ? item.current_streak > 0 : item.is_completed);

            return (
              <article
                key={item.id}
                className="surface-card flex flex-col justify-between rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_STYLES[item.category]}`}
                      >
                        {t.mySpace.habits.categories[item.category]}
                      </span>
                      <span className="rounded-full bg-[#F4F0EA] px-2 py-0.5 text-[11px] font-medium text-[#57534E]">
                        {t.mySpace.habits.cadences[item.cadence]}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                        aria-label={t.common.edit}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3
                    className={`mt-3 font-display text-base font-bold ${
                      !isHabit && doneToday
                        ? "text-[#78716C] line-through"
                        : "text-[#1C1917]"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Reminder & Due Date metadata */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6B655E]">
                    {item.reminder_time && (
                      <span className="inline-flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5 text-[#C86D51]" />
                        <span>{item.reminder_time}</span>
                      </span>
                    )}
                    {item.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#3B6998]" />
                        <span>{formatDate(item.due_date)}</span>
                      </span>
                    )}
                    {isHabit && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#9E7022]">
                        <Flame className="h-3.5 w-3.5 text-[#C86D51]" />
                        <span className="tabular-nums">
                          {item.current_streak}{" "}
                          {item.cadence === "weekly"
                            ? t.mySpace.habits.weeksUnit
                            : t.mySpace.habits.daysUnit}
                        </span>
                        {item.best_streak > 0 && (
                          <span className="font-normal text-[#78716C]">
                            ({t.mySpace.habits.bestStreakLabel}:{" "}
                            {item.best_streak})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* 7-day habit strip */}
                  {isHabit && (
                    <div className="mt-3 flex items-center gap-1.5">
                      {last7Days.map((dayKey) => {
                        const checked = (item.completed_dates ?? []).includes(
                          dayKey
                        );
                        return (
                          <span
                            key={dayKey}
                            title={dayKey}
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              checked
                                ? "bg-[#2D5A47] text-white"
                                : dayKey === todayKey
                                  ? "border border-dashed border-[#2D5A47] bg-[#E9F2EE]/60 text-[#2D5A47]"
                                  : "bg-[#F4F0EA] text-[#A8A29E]"
                            }`}
                          >
                            {checked ? <Check className="h-3 w-3" /> : "·"}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Strictly private notes */}
                  {item.private_notes && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-[#FAF8F5] p-2.5 text-xs text-[#57534E]">
                      <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#A8A29E]" />
                      <p className="line-clamp-2 whitespace-pre-line">
                        {item.private_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFEAE2] pt-3.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleToggleHabitCheckIn(item)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-60 ${
                      doneToday
                        ? "bg-[#E9F2EE] text-[#234738]"
                        : "bg-[#2D5A47] text-white hover:bg-[#234738]"
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : doneToday ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isHabit
                        ? doneToday
                          ? t.mySpace.habits.checkedInToday
                          : t.mySpace.habits.checkInToday
                        : doneToday
                          ? t.mySpace.habits.completedLabel
                          : t.mySpace.habits.markDone}
                    </span>
                  </button>

                  {canCelebrateNow && (
                    <button
                      type="button"
                      disabled={isSharing}
                      onClick={() => void handleShareMilestone(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAD9B0] bg-[#FAF4E6] px-3 py-2 text-xs font-semibold text-[#855F1C] transition hover:bg-[#F5E9CE] cursor-pointer disabled:opacity-60"
                    >
                      {isSharing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isSharing
                          ? t.mySpace.habits.sharingMilestone
                          : t.mySpace.habits.shareMilestoneButton}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Habit or Task Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingItem ? t.mySpace.habits.editItem : t.mySpace.habits.newItem
        }
      >
        <form
          onSubmit={handleSave}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          {/* Kind Toggle */}
          <div className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#57534E]">
              {t.mySpace.habits.kindLabel}
            </span>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F0EA] p-1">
              <button
                type="button"
                onClick={() => {
                  setKind("habit");
                  if (cadence === "once") setCadence("daily");
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  kind === "habit"
                    ? "bg-white text-[#2D5A47] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.mySpace.habits.kindHabit}
              </button>
              <button
                type="button"
                onClick={() => {
                  setKind("task");
                  setCadence("once");
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  kind === "task"
                    ? "bg-white text-[#1C1917] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.mySpace.habits.kindTask}
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="habit-title-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.habits.titleLabel}
            </label>
            <input
              id="habit-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "habit"
                  ? t.mySpace.habits.titlePlaceholderHabit
                  : t.mySpace.habits.titlePlaceholderTask
              }
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="habit-category-select"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.habits.categoryLabel}
              </label>
              <select
                id="habit-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="input-base"
              >
                {(
                  [
                    "spiritual",
                    "study",
                    "music",
                    "health",
                    "personal",
                    "other",
                  ] as HabitCategory[]
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {t.mySpace.habits.categories[cat]}
                  </option>
                ))}
              </select>
            </div>

            {kind === "habit" ? (
              <div className="min-w-0">
                <label
                  htmlFor="habit-cadence-select"
                  className="mb-1 block text-xs font-semibold text-[#57534E]"
                >
                  {t.mySpace.habits.cadenceLabel}
                </label>
                <select
                  id="habit-cadence-select"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as HabitCadence)}
                  className="input-base"
                >
                  <option value="daily">{t.mySpace.habits.cadences.daily}</option>
                  <option value="weekly">
                    {t.mySpace.habits.cadences.weekly}
                  </option>
                </select>
              </div>
            ) : (
              <div className="min-w-0">
                <label
                  htmlFor="task-due-date"
                  className="mb-1 block text-xs font-semibold text-[#57534E]"
                >
                  {t.mySpace.habits.dueDateLabel}{" "}
                  <span className="font-normal text-[#A8A29E]">
                    ({t.common.optional})
                  </span>
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-base w-full min-w-0 max-w-full box-border"
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label
              htmlFor="habit-reminder-time"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.habits.reminderTimeLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <input
              id="habit-reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input-base w-full min-w-0 max-w-full box-border"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="habit-private-notes"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.habits.privateNotesLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <textarea
              id="habit-private-notes"
              rows={3}
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder={t.mySpace.habits.privateNotesPlaceholder}
              className="input-base resize-none"
            />
            <p className="mt-1 text-[11px] text-[#78716C]">
              {t.mySpace.habits.privateNotesHint}
            </p>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowShare}
              onChange={(e) => setAllowShare(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D5CDC1] accent-[#2D5A47]"
            />
            <span className="min-w-0 text-xs">
              <span className="block font-semibold text-[#1C1917]">
                {t.mySpace.habits.allowShareLabel}
              </span>
              <span className="mt-0.5 block text-[#6B655E]">
                {t.mySpace.habits.allowShareHint}
              </span>
            </span>
          </label>

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
              {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
