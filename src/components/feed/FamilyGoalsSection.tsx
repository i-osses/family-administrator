"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import type {
  FamilyFeedPost,
  FamilyGoal,
  FamilyGoalCategory,
} from "@/types/database";

interface FamilyGoalsSectionProps {
  goals: FamilyGoal[];
  posts: FamilyFeedPost[];
  onChanged: () => Promise<void>;
}

const GOAL_BADGE_STYLES: Record<FamilyGoalCategory, string> = {
  spiritual: "bg-[#FAF4E6] text-[#855F1C]",
  learning: "bg-[#EBF2F8] text-[#284D72]",
  adventure: "bg-[#E9F2EE] text-[#234738]",
  health: "bg-[#FBF0EC] text-[#9A4B33]",
  other: "bg-[#F4F2EF] text-[#57534E]",
};

export function FamilyGoalsSection({
  goals,
  posts,
  onChanged,
}: FamilyGoalsSectionProps) {
  const { t, tv } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily } = useFamily();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FamilyGoalCategory>("spiritual");
  const [targetCount, setTargetCount] = useState("5");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle("");
    setCategory("spiritual");
    setTargetCount("5");
    setNotes("");
    setModalOpen(true);
  };

  const openEditModal = (goal: FamilyGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setCategory(goal.category);
    setTargetCount(String(goal.target_count));
    setNotes(goal.notes ?? "");
    setModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !title.trim()) return;
    const parsedTarget = Math.max(1, Math.round(Number(targetCount) || 5));

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        title: title.trim(),
        category,
        target_count: parsedTarget,
        notes: notes.trim() || null,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("family_goals")
          .update(payload)
          .eq("id", editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("family_goals").insert({
          ...payload,
          created_by: profile.id,
        });
        if (error) throw error;
      }

      setModalOpen(false);
      showToast(tv.goals.goalSavedToast, "success");
      await onChanged();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (goal: FamilyGoal) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_goals")
      .update({ is_completed: !goal.is_completed })
      .eq("id", goal.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    await onChanged();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm(tv.goals.confirmDeleteGoal)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("family_goals")
      .delete()
      .eq("id", goalId);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(tv.goals.goalDeletedToast, "success");
    await onChanged();
  };

  return (
    <section className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4.5 w-4.5 text-[#2D5A47]" />
          <div>
            <h2 className="font-display text-sm font-bold text-[#1C1917] sm:text-base">
              {tv.goals.sectionTitle}
            </h2>
            <p className="text-[11px] text-[#6B655E]">
              {tv.goals.sectionSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="new-family-goal-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1 rounded-xl bg-[#E9F2EE] px-3 py-1.5 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{tv.goals.newGoal}</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] px-4 py-4 text-center text-xs text-[#6B655E]">
          {tv.goals.emptyText}
        </p>
      ) : (
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const linkedCount = posts.filter(
              (p) => p.family_goal_id === goal.id
            ).length;
            const pct = Math.min(
              100,
              Math.round((linkedCount / Math.max(1, goal.target_count)) * 100)
            );
            const done = goal.is_completed || linkedCount >= goal.target_count;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GOAL_BADGE_STYLES[goal.category]}`}
                  >
                    {tv.goals.categories[goal.category]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleToggleComplete(goal)}
                      className={`rounded-md p-1 transition cursor-pointer ${
                        done
                          ? "text-[#2D5A47]"
                          : "text-[#A8A29E] hover:text-[#2D5A47]"
                      }`}
                      aria-label={tv.goals.markComplete}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(goal)}
                      className="rounded-md p-1 text-[#78716C] transition hover:text-[#1C1917] cursor-pointer"
                      aria-label={t.common.edit}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGoal(goal.id)}
                      className="rounded-md p-1 text-[#78716C] transition hover:text-[#C86D51] cursor-pointer"
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-2 truncate text-sm font-bold text-[#1C1917]">
                  {goal.title}
                </h3>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B655E]">
                  <span className="tabular-nums">
                    <strong className="text-[#1C1917]">
                      {linkedCount}/{goal.target_count}
                    </strong>{" "}
                    {tv.goals.linkedMemoriesLabel}
                  </span>
                  <span className="font-semibold tabular-nums text-[#2D5A47]">
                    {done ? tv.goals.completedBadge : `${pct}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E7E1D8]">
                  <div
                    className="h-full rounded-full bg-[#2D5A47] transition-all duration-300"
                    style={{ width: `${done ? 100 : Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Zero-Scroll Goal Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? tv.goals.editGoal : tv.goals.newGoal}
      >
        <form
          onSubmit={handleSaveGoal}
          className="box-border w-full max-w-full min-w-0 space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tv.goals.titlePlaceholder}
            aria-label={tv.goals.titleLabel}
            className="input-base py-2"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label
                htmlFor="family-goal-cat"
                className="mb-0.5 block text-[11px] font-semibold text-[#57534E]"
              >
                {tv.goals.categoryLabel}
              </label>
              <select
                id="family-goal-cat"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as FamilyGoalCategory)
                }
                className="input-base py-1.5"
              >
                {(
                  [
                    "spiritual",
                    "learning",
                    "adventure",
                    "health",
                    "other",
                  ] as FamilyGoalCategory[]
                ).map((c) => (
                  <option key={c} value={c}>
                    {tv.goals.categories[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                htmlFor="family-goal-target"
                className="mb-0.5 block text-[11px] font-semibold text-[#57534E]"
              >
                {tv.goals.targetLabel}
              </label>
              <input
                id="family-goal-target"
                type="number"
                min={1}
                max={365}
                required
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                className="input-base py-1.5 tabular-nums"
              />
            </div>
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tv.goals.notesPlaceholder}
            aria-label={tv.goals.notesLabel}
            className="input-base py-2"
          />

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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.common.save
              )}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
