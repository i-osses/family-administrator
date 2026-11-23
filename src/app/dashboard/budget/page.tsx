"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  PieChart,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import type { BudgetEntry, BudgetType } from "@/types/database";

function todayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

const BAR_COLORS = [
  "bg-[#2D5A47]",
  "bg-[#C86D51]",
  "bg-[#3B6998]",
  "bg-[#B8862D]",
  "bg-[#2C7A7B]",
  "bg-[#9E4F73]",
  "bg-[#78716C]",
];

export default function BudgetPage() {
  const { t, locale, formatCurrency, formatDate, translateBudgetCategory } =
    useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, members, loadingFamilies } = useFamily();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | BudgetType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [breakdownTab, setBreakdownTab] = useState<BudgetType>("expense");

  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [entryType, setEntryType] = useState<BudgetType>("expense");
  const [category, setCategory] = useState<string>("groceries");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(todayDateInput);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!activeFamily) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("budget_entries")
        .select("*")
        .eq("family_id", activeFamily.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!showAllMonths) {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          lastDay
        ).padStart(2, "0")}`;
        query = query.gte("entry_date", start).lte("entry_date", end);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch budget entries:", error.message);
        return;
      }

      setEntries((data as BudgetEntry[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeFamily, selectedMonth, showAllMonths]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEntries();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEntries]);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(
        m.user_id,
        m.profile?.full_name || m.profile?.email || t.common.unknownMember
      );
    }
    return map;
  }, [members, t.common.unknownMember]);

  const totalIncome = useMemo(
    () =>
      entries
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount), 0),
    [entries]
  );

  const totalExpenses = useMemo(
    () =>
      entries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount), 0),
    [entries]
  );

  const netBalance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : null;

  const breakdownItems = useMemo(() => {
    const subset = entries.filter((e) => e.type === breakdownTab);
    const total = subset.reduce((sum, e) => sum + Number(e.amount), 0);
    const grouped = new Map<string, number>();

    for (const item of subset) {
      const key = item.category.toLowerCase();
      grouped.set(key, (grouped.get(key) ?? 0) + Number(item.amount));
    }

    return Array.from(grouped.entries())
      .map(([cat, sum]) => ({
        category: cat,
        amount: sum,
        percentage: total > 0 ? (sum / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [entries, breakdownTab]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      set.add(e.category.toLowerCase());
    }
    return Array.from(set).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (
        categoryFilter !== "all" &&
        entry.category.toLowerCase() !== categoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [entries, typeFilter, categoryFilter]);

  const openCreateModal = (defaultType: BudgetType = "expense") => {
    setEditingEntry(null);
    setEntryType(defaultType);
    setCategory(defaultType === "expense" ? "groceries" : "salary");
    setCustomCategory("");
    setAmount("");
    const currentMonthKey = monthKeyFromDate(selectedMonth);
    const todayStr = todayDateInput();
    setEntryDate(
      !showAllMonths && !todayStr.startsWith(currentMonthKey)
        ? `${currentMonthKey}-01`
        : todayStr
    );
    setDescription("");
    setModalOpen(true);
  };

  const openEditModal = (entry: BudgetEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    const presets: readonly string[] =
      entry.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (presets.includes(entry.category.toLowerCase())) {
      setCategory(entry.category.toLowerCase());
      setCustomCategory("");
    } else {
      setCategory("__custom__");
      setCustomCategory(entry.category);
    }
    setAmount(String(entry.amount));
    setEntryDate(entry.entry_date);
    setDescription(entry.description ?? "");
    setModalOpen(true);
  };

  const handleTypeSwitchInModal = (nextType: BudgetType) => {
    setEntryType(nextType);
    const presets: readonly string[] =
      nextType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (category !== "__custom__" && !presets.includes(category)) {
      setCategory(presets[0]);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showToast(t.budget.invalidAmountError, "error");
      return;
    }

    const finalCategory =
      category === "__custom__" ? customCategory.trim() : category;
    if (!finalCategory) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        type: entryType,
        category: finalCategory,
        amount: Math.round(numericAmount * 100) / 100,
        description: description.trim() || null,
        entry_date: entryDate,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("budget_entries")
          .update(payload)
          .eq("id", editingEntry.id);
        if (error) throw error;
        showToast(t.budget.entryUpdatedToast, "success");
      } else {
        const { error } = await supabase.from("budget_entries").insert({
          ...payload,
          created_by: profile.id,
        });
        if (error) throw error;
        showToast(t.budget.entryCreatedToast, "success");
      }

      setModalOpen(false);
      await loadEntries();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm(t.budget.confirmDeleteEntry)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("budget_entries")
      .delete()
      .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.budget.entryDeletedToast, "success");
    await loadEntries();
  };

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(selectedMonth);

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

  const activeCategoryPresets =
    entryType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.budget.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.budget.subtitle}</p>
        </div>

        <button
          type="button"
          id="new-budget-entry-btn"
          onClick={() => openCreateModal("expense")}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.budget.newEntry}</span>
        </button>
      </div>

      {/* Month Selector & Filters */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={showAllMonths}
            onClick={() =>
              setSelectedMonth(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth() - 1,
                  1
                )
              )
            }
            className="rounded-xl border border-[#DFD8CE] bg-white p-2 text-[#57534E] transition hover:bg-[#F5F2EC] disabled:opacity-40 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[148px] text-center font-display text-sm font-bold capitalize text-[#1C1917]">
            {showAllMonths ? t.budget.allMonths : monthLabel}
          </span>
          <button
            type="button"
            disabled={showAllMonths}
            onClick={() =>
              setSelectedMonth(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth() + 1,
                  1
                )
              )
            }
            className="rounded-xl border border-[#DFD8CE] bg-white p-2 text-[#57534E] transition hover:bg-[#F5F2EC] disabled:opacity-40 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowAllMonths((prev) => !prev)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              showAllMonths
                ? "border-[#2D5A47] bg-[#E9F2EE] text-[#234738]"
                : "border-[#DFD8CE] bg-white text-[#57534E] hover:bg-[#F5F2EC]"
            }`}
          >
            {t.budget.allMonths}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t.budget.typeLabel}
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | BudgetType)
            }
            className="rounded-xl border border-[#DFD8CE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] focus:border-[#2D5A47] focus:outline-none"
          >
            <option value="all">{t.budget.allTypes}</option>
            <option value="income">{t.budget.income}</option>
            <option value="expense">{t.budget.expense}</option>
          </select>

          <select
            aria-label={t.budget.categoryLabel}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#DFD8CE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] focus:border-[#2D5A47] focus:outline-none"
          >
            <option value="all">{t.budget.allCategories}</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {translateBudgetCategory(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
            <span>{t.budget.totalIncome}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E9F2EE] text-[#2D5A47]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums text-[#2D5A47] sm:text-3xl">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
            <span>{t.budget.totalExpenses}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF0EC] text-[#C86D51]">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums text-[#C86D51] sm:text-3xl">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B655E]">
            <span>{t.budget.netBalance}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3EFE9] text-[#57534E]">
              <Scale className="h-4 w-4" />
            </span>
          </div>
          <p
            className={`mt-3 font-display text-2xl font-bold tabular-nums sm:text-3xl ${
              netBalance >= 0 ? "text-[#1C1917]" : "text-[#C86D51]"
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
          {savingsRate !== null && (
            <p className="mt-1 text-xs text-[#78716C]">
              {t.budget.savingsRate}:{" "}
              <span className="font-semibold tabular-nums text-[#1C1917]">
                {savingsRate}%
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown & Ledger */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Category Breakdown */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-[#2D5A47]" />
              <h2 className="font-display text-base font-bold text-[#1C1917]">
                {t.budget.breakdownTitle}
              </h2>
            </div>

            <div className="inline-flex rounded-lg border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setBreakdownTab("expense")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  breakdownTab === "expense"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.budget.expense}
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab("income")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  breakdownTab === "income"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.budget.income}
              </button>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#78716C]" />
              </div>
            ) : breakdownItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] py-10 text-center text-xs text-[#6B655E]">
                {t.budget.noEntriesTitle}
              </p>
            ) : (
              <ul className="space-y-4">
                {breakdownItems.map((item, idx) => (
                  <li key={item.category}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#1C1917]">
                        {translateBudgetCategory(item.category)}
                      </span>
                      <span className="tabular-nums text-[#57534E]">
                        <strong className="font-semibold text-[#1C1917]">
                          {formatCurrency(item.amount)}
                        </strong>{" "}
                        ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#EFEAE2]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          BAR_COLORS[idx % BAR_COLORS.length]
                        }`}
                        style={{
                          width: `${Math.max(4, Math.min(100, item.percentage))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Transactions Ledger */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              {t.budget.transactionsTitle}
            </h2>
            <span className="text-xs font-medium text-[#78716C]">
              {filteredEntries.length} {t.budget.entriesCount}
            </span>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#78716C]" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-8 text-center">
                <Wallet className="h-8 w-8 text-[#A8A29E]" />
                <p className="mt-3 text-sm font-semibold text-[#1C1917]">
                  {t.budget.noEntriesTitle}
                </p>
                <p className="mt-1 max-w-sm text-xs text-[#6B655E]">
                  {t.budget.noEntriesSubtitle}
                </p>
                <button
                  type="button"
                  onClick={() => openCreateModal("expense")}
                  className="btn-primary mt-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.budget.newEntry}</span>
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[#EFEAE2]">
                {filteredEntries.map((entry) => {
                  const isIncome = entry.type === "income";
                  const author = entry.created_by
                    ? memberNameMap.get(entry.created_by)
                    : null;

                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isIncome
                                ? "bg-[#E9F2EE] text-[#234738]"
                                : "bg-[#FBF0EC] text-[#9A4B33]"
                            }`}
                          >
                            {translateBudgetCategory(entry.category)}
                          </span>
                          <span className="text-xs text-[#78716C]">
                            {formatDate(entry.entry_date)}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="mt-1 truncate text-sm font-medium text-[#1C1917]">
                            {entry.description}
                          </p>
                        )}
                        {author && (
                          <p className="mt-0.5 text-[11px] text-[#78716C]">
                            {author}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`font-display text-sm font-bold tabular-nums sm:text-base ${
                            isIncome ? "text-[#2D5A47]" : "text-[#C86D51]"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(Number(entry.amount))}
                        </span>

                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                          aria-label={t.common.edit}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEntry(entry.id)}
                          className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                          aria-label={t.common.delete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Create / Edit Budget Entry Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? t.budget.editEntry : t.budget.newEntry}
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          {/* Type Segmented Toggle */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[#57534E]">
              {t.budget.typeLabel}
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F4F0EA] p-1">
              <button
                type="button"
                onClick={() => handleTypeSwitchInModal("expense")}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  entryType === "expense"
                    ? "bg-white text-[#C86D51] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.budget.expense}
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitchInModal("income")}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  entryType === "income"
                    ? "bg-white text-[#2D5A47] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.budget.income}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="budget-amount-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.amountLabel} (USD)
              </label>
              <input
                id="budget-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-base tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="budget-date-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.dateLabel}
              </label>
              <input
                id="budget-date-input"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="budget-category-select"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.budget.categoryLabel}
            </label>
            <select
              id="budget-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-base"
            >
              {activeCategoryPresets.map((preset) => (
                <option key={preset} value={preset}>
                  {translateBudgetCategory(preset)}
                </option>
              ))}
              <option value="__custom__">
                + {t.budget.customCategoryPlaceholder}
              </option>
            </select>

            {category === "__custom__" && (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={t.budget.customCategoryPlaceholder}
                className="input-base mt-2"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="budget-description-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.budget.descriptionLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <input
              id="budget-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.budget.descriptionPlaceholder}
              className="input-base"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.common.saving}</span>
                </>
              ) : (
                <span>
                  {editingEntry ? t.common.save : t.common.create}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
