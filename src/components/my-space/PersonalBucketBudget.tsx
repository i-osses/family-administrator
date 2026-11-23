"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Edit3,
  HandHeart,
  Landmark,
  Loader2,
  PiggyBank,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import type {
  PersonalBucket,
  PersonalBucketTransaction,
  PersonalBudgetSettings,
  PersonalIncomeEntry,
  PersonalRecurringExpense,
  RecurringFrequency,
} from "@/types/database";

function todayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function roundCents(val: number): number {
  return Math.round(val * 100) / 100;
}

function calculateSplit(
  amount: number,
  tithingPct: number,
  investmentPct: number,
  savingsPct: number
) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const tithing = roundCents((safeAmount * tithingPct) / 100);
  const investment = roundCents((safeAmount * investmentPct) / 100);
  const savings = roundCents((safeAmount * savingsPct) / 100);
  const freeToSpend = roundCents(
    Math.max(0, safeAmount - tithing - investment - savings)
  );
  return { tithing, investment, savings, freeToSpend };
}

export function PersonalBucketBudget() {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { showToast } = useToast();
  const { profile } = useFamily();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PersonalBudgetSettings>({
    user_id: profile.id,
    tithing_pct: 10,
    investment_pct: 10,
    savings_pct: 10,
    updated_at: "",
  });
  const [incomeEntries, setIncomeEntries] = useState<PersonalIncomeEntry[]>([]);
  const [transactions, setTransactions] = useState<PersonalBucketTransaction[]>(
    []
  );
  const [recurringExpenses, setRecurringExpenses] = useState<
    PersonalRecurringExpense[]
  >([]);
  const [historyTab, setHistoryTab] = useState<"income" | "disbursements">(
    "disbursements"
  );

  // Allocation Settings Modal
  const [splitsOpen, setSplitsOpen] = useState(false);
  const [tithingDraft, setTithingDraft] = useState("10");
  const [investmentDraft, setInvestmentDraft] = useState("10");
  const [savingsDraft, setSavingsDraft] = useState("10");
  const [savingSplits, setSavingSplits] = useState(false);

  // Record Income Modal
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(todayDateInput);
  const [incomeNotes, setIncomeNotes] = useState("");
  const [savingIncome, setSavingIncome] = useState(false);

  // Record Disbursement / Expense Modal
  const [txOpen, setTxOpen] = useState(false);
  const [txBucket, setTxBucket] = useState<PersonalBucket>("free_to_spend");
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(todayDateInput);
  const [txNotes, setTxNotes] = useState("");
  const [savingTx, setSavingTx] = useState(false);

  // Recurring Expense Modal
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] =
    useState<PersonalRecurringExpense | null>(null);
  const [recTitle, setRecTitle] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFrequency, setRecFrequency] =
    useState<RecurringFrequency>("monthly");
  const [recBillingDay, setRecBillingDay] = useState("1");
  const [recAutoApply, setRecAutoApply] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [applyingRecurringId, setApplyingRecurringId] = useState<string | null>(
    null
  );
  const [applyingAllAuto, setApplyingAllAuto] = useState(false);

  const monthKey = useMemo(() => currentMonthKey(), []);
  const todayDayOfMonth = useMemo(() => new Date().getDate(), []);

  const loadPersonalBudget = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const supabase = createClient();
      const [settingsRes, incomeRes, txRes, recurringRes] = await Promise.all([
        supabase
          .from("personal_budget_settings")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle(),
        supabase
          .from("personal_income_entries")
          .select("*")
          .eq("user_id", profile.id)
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("personal_bucket_transactions")
          .select("*")
          .eq("user_id", profile.id)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("personal_recurring_expenses")
          .select("*")
          .eq("user_id", profile.id)
          .order("billing_day", { ascending: true }),
      ]);

      if (settingsRes.data) {
        const s = settingsRes.data as PersonalBudgetSettings;
        setSettings({
          ...s,
          tithing_pct: Number(s.tithing_pct),
          investment_pct: Number(s.investment_pct),
          savings_pct: Number(s.savings_pct),
        });
      }
      setIncomeEntries((incomeRes.data as PersonalIncomeEntry[]) ?? []);
      setTransactions((txRes.data as PersonalBucketTransaction[]) ?? []);
      setRecurringExpenses(
        (recurringRes.data as PersonalRecurringExpense[]) ?? []
      );
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPersonalBudget();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPersonalBudget]);

  const freeToSpendPct = useMemo(
    () =>
      roundCents(
        100 -
          (settings.tithing_pct +
            settings.investment_pct +
            settings.savings_pct)
      ),
    [settings]
  );

  // Running bucket balances
  const balances = useMemo(() => {
    const incomeTotals = incomeEntries.reduce(
      (acc, entry) => ({
        tithing: acc.tithing + Number(entry.tithing_amount),
        investment: acc.investment + Number(entry.investment_amount),
        savings: acc.savings + Number(entry.savings_amount),
        free_to_spend: acc.free_to_spend + Number(entry.free_to_spend_amount),
      }),
      { tithing: 0, investment: 0, savings: 0, free_to_spend: 0 }
    );

    const spentTotals = transactions.reduce(
      (acc, tx) => {
        acc[tx.bucket] += Number(tx.amount);
        return acc;
      },
      { tithing: 0, investment: 0, savings: 0, free_to_spend: 0 }
    );

    return {
      tithing: roundCents(incomeTotals.tithing - spentTotals.tithing),
      investment: roundCents(incomeTotals.investment - spentTotals.investment),
      savings: roundCents(incomeTotals.savings - spentTotals.savings),
      free_to_spend: roundCents(
        incomeTotals.free_to_spend - spentTotals.free_to_spend
      ),
    };
  }, [incomeEntries, transactions]);

  const upcomingRecurringTotal = useMemo(() => {
    return roundCents(
      recurringExpenses
        .filter((r) => r.is_active && r.last_paid_month !== monthKey)
        .reduce((sum, r) => sum + Number(r.amount), 0)
    );
  }, [recurringExpenses, monthKey]);

  const dueAutoBills = useMemo(
    () =>
      recurringExpenses.filter(
        (r) =>
          r.is_active &&
          r.auto_apply &&
          r.last_paid_month !== monthKey &&
          r.billing_day <= todayDayOfMonth
      ),
    [recurringExpenses, monthKey, todayDayOfMonth]
  );

  const netAfterRecurring = roundCents(
    balances.free_to_spend - upcomingRecurringTotal
  );

  const liveIncomeSplit = useMemo(() => {
    const parsed = Number(incomeAmount);
    return calculateSplit(
      parsed,
      settings.tithing_pct,
      settings.investment_pct,
      settings.savings_pct
    );
  }, [incomeAmount, settings]);

  const openSplitsModal = () => {
    setTithingDraft(String(settings.tithing_pct));
    setInvestmentDraft(String(settings.investment_pct));
    setSavingsDraft(String(settings.savings_pct));
    setSplitsOpen(true);
  };

  const handleSaveSplits = async (e: React.FormEvent) => {
    e.preventDefault();
    const tPct = Number(tithingDraft);
    const iPct = Number(investmentDraft);
    const sPct = Number(savingsDraft);

    if (
      !Number.isFinite(tPct) ||
      !Number.isFinite(iPct) ||
      !Number.isFinite(sPct) ||
      tPct < 10 ||
      iPct < 10 ||
      sPct < 10
    ) {
      showToast(t.mySpace.budget.minTenPercentRule, "error");
      return;
    }

    if (tPct + iPct + sPct > 100) {
      showToast(t.mySpace.budget.totalExceedsHundredError, "error");
      return;
    }

    setSavingSplits(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("personal_budget_settings").upsert(
        {
          user_id: profile.id,
          tithing_pct: tPct,
          investment_pct: iPct,
          savings_pct: sPct,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      setSettings({
        user_id: profile.id,
        tithing_pct: tPct,
        investment_pct: iPct,
        savings_pct: sPct,
        updated_at: new Date().toISOString(),
      });
      setSplitsOpen(false);
      showToast(t.mySpace.budget.splitsSavedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingSplits(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(incomeAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast(t.budget.invalidAmountError, "error");
      return;
    }
    if (!incomeSource.trim()) return;

    const split = calculateSplit(
      amountNum,
      settings.tithing_pct,
      settings.investment_pct,
      settings.savings_pct
    );

    setSavingIncome(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("personal_income_entries").insert({
        user_id: profile.id,
        source: incomeSource.trim(),
        amount: roundCents(amountNum),
        tithing_pct: settings.tithing_pct,
        investment_pct: settings.investment_pct,
        savings_pct: settings.savings_pct,
        tithing_amount: split.tithing,
        investment_amount: split.investment,
        savings_amount: split.savings,
        free_to_spend_amount: split.freeToSpend,
        entry_date: incomeDate,
        notes: incomeNotes.trim() || null,
      });
      if (error) throw error;

      setIncomeOpen(false);
      setIncomeSource("");
      setIncomeAmount("");
      setIncomeNotes("");
      setIncomeDate(todayDateInput());
      showToast(t.mySpace.budget.incomeSavedToast, "success");
      await loadPersonalBudget();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingIncome(false);
    }
  };

  const openDisbursementModal = (bucket: PersonalBucket) => {
    setTxBucket(bucket);
    setTxTitle("");
    setTxAmount("");
    setTxDate(todayDateInput());
    setTxNotes("");
    setTxOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast(t.budget.invalidAmountError, "error");
      return;
    }
    if (!txTitle.trim()) return;

    setSavingTx(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("personal_bucket_transactions")
        .insert({
          user_id: profile.id,
          bucket: txBucket,
          title: txTitle.trim(),
          amount: roundCents(amountNum),
          transaction_date: txDate,
          notes: txNotes.trim() || null,
        });
      if (error) throw error;

      setTxOpen(false);
      showToast(t.mySpace.budget.disbursementSavedToast, "success");
      await loadPersonalBudget();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingTx(false);
    }
  };

  const openRecurringModal = (item?: PersonalRecurringExpense) => {
    if (item) {
      setEditingRecurring(item);
      setRecTitle(item.title);
      setRecAmount(String(item.amount));
      setRecFrequency(item.frequency);
      setRecBillingDay(String(item.billing_day));
      setRecAutoApply(item.auto_apply);
    } else {
      setEditingRecurring(null);
      setRecTitle("");
      setRecAmount("");
      setRecFrequency("monthly");
      setRecBillingDay("1");
      setRecAutoApply(false);
    }
    setRecurringOpen(true);
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(recAmount);
    const dayNum = Math.min(31, Math.max(1, Math.round(Number(recBillingDay) || 1)));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast(t.budget.invalidAmountError, "error");
      return;
    }
    if (!recTitle.trim()) return;

    setSavingRecurring(true);
    try {
      const supabase = createClient();
      const payload = {
        user_id: profile.id,
        title: recTitle.trim(),
        amount: roundCents(amountNum),
        frequency: recFrequency,
        billing_day: dayNum,
        auto_apply: recAutoApply,
        is_active: true,
      };

      if (editingRecurring) {
        const { error } = await supabase
          .from("personal_recurring_expenses")
          .update(payload)
          .eq("id", editingRecurring.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personal_recurring_expenses")
          .insert(payload);
        if (error) throw error;
      }

      setRecurringOpen(false);
      showToast(t.mySpace.budget.recurringSavedToast, "success");
      await loadPersonalBudget();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingRecurring(false);
    }
  };

  const handleMarkRecurringPaid = async (item: PersonalRecurringExpense) => {
    setApplyingRecurringId(item.id);
    try {
      const supabase = createClient();
      const { error: txError } = await supabase
        .from("personal_bucket_transactions")
        .insert({
          user_id: profile.id,
          bucket: "free_to_spend",
          title: item.title,
          amount: roundCents(Number(item.amount)),
          transaction_date: todayDateInput(),
          recurring_expense_id: item.id,
        });
      if (txError) throw txError;

      const { error: updateError } = await supabase
        .from("personal_recurring_expenses")
        .update({ last_paid_month: monthKey })
        .eq("id", item.id);
      if (updateError) throw updateError;

      showToast(t.mySpace.budget.recurringPaidToast, "success");
      await loadPersonalBudget();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setApplyingRecurringId(null);
    }
  };

  const handleApplyDueAutoBills = async () => {
    if (dueAutoBills.length === 0) return;
    setApplyingAllAuto(true);
    try {
      const supabase = createClient();
      const todayStr = todayDateInput();
      const txPayload = dueAutoBills.map((bill) => ({
        user_id: profile.id,
        bucket: "free_to_spend" as const,
        title: bill.title,
        amount: roundCents(Number(bill.amount)),
        transaction_date: todayStr,
        recurring_expense_id: bill.id,
      }));

      const { error: txErr } = await supabase
        .from("personal_bucket_transactions")
        .insert(txPayload);
      if (txErr) throw txErr;

      const { error: updErr } = await supabase
        .from("personal_recurring_expenses")
        .update({ last_paid_month: monthKey })
        .in(
          "id",
          dueAutoBills.map((b) => b.id)
        );
      if (updErr) throw updErr;

      showToast(t.mySpace.budget.appliedAutoBillsToast, "success");
      await loadPersonalBudget();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setApplyingAllAuto(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm(t.mySpace.budget.confirmDeleteIncome)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_income_entries")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.mySpace.budget.incomeDeletedToast, "success");
    await loadPersonalBudget();
  };

  const handleDeleteTx = async (id: string) => {
    if (!window.confirm(t.mySpace.budget.confirmDeleteTx)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_bucket_transactions")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.mySpace.budget.disbursementDeletedToast, "success");
    await loadPersonalBudget();
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!window.confirm(t.mySpace.budget.confirmDeleteRecurring)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_recurring_expenses")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.mySpace.budget.recurringDeletedToast, "success");
    await loadPersonalBudget();
  };

  const draftFreeToSpendPct = useMemo(() => {
    const tVal = Number(tithingDraft) || 0;
    const iVal = Number(investmentDraft) || 0;
    const sVal = Number(savingsDraft) || 0;
    return roundCents(100 - (tVal + iVal + sVal));
  }, [tithingDraft, investmentDraft, savingsDraft]);

  if (loading) {
    return (
      <div className="surface-card flex h-56 items-center justify-center rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  const bucketCards: {
    key: PersonalBucket;
    pct: number;
    balance: number;
    icon: React.ComponentType<{ className?: string }>;
    tint: string;
    actionLabel: string;
  }[] = [
    {
      key: "tithing",
      pct: settings.tithing_pct,
      balance: balances.tithing,
      icon: HandHeart,
      tint: "bg-[#FAF4E6] text-[#9E7022]",
      actionLabel: t.mySpace.budget.quickPayTithing,
    },
    {
      key: "investment",
      pct: settings.investment_pct,
      balance: balances.investment,
      icon: Landmark,
      tint: "bg-[#EBF2F8] text-[#3B6998]",
      actionLabel: t.mySpace.budget.quickInvest,
    },
    {
      key: "savings",
      pct: settings.savings_pct,
      balance: balances.savings,
      icon: PiggyBank,
      tint: "bg-[#E9F2EE] text-[#2D5A47]",
      actionLabel: t.mySpace.budget.recordDisbursement,
    },
    {
      key: "free_to_spend",
      pct: freeToSpendPct,
      balance: balances.free_to_spend,
      icon: Wallet,
      tint: "bg-[#FBF0EC] text-[#C86D51]",
      actionLabel: t.mySpace.budget.quickSpend,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header & Actions */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1C1917] sm:text-xl">
            {t.mySpace.budget.heading}
          </h2>
          <p className="mt-0.5 text-xs text-[#57534E] sm:text-sm">
            {t.mySpace.budget.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="configure-bucket-splits-btn"
            onClick={openSplitsModal}
            className="btn-secondary text-xs sm:text-sm"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#57534E]" />
            <span>{t.mySpace.budget.configureSplits}</span>
          </button>
          <button
            type="button"
            id="record-bucket-disbursement-btn"
            onClick={() => openDisbursementModal("free_to_spend")}
            className="btn-secondary text-xs sm:text-sm"
          >
            <ArrowUpRight className="h-4 w-4 text-[#C86D51]" />
            <span>{t.mySpace.budget.quickSpend}</span>
          </button>
          <button
            type="button"
            id="record-personal-income-btn"
            onClick={() => setIncomeOpen(true)}
            className="btn-primary text-xs sm:text-sm"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>{t.mySpace.budget.recordIncome}</span>
          </button>
        </div>
      </div>

      {/* Four Running Bucket Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bucketCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="surface-card flex flex-col justify-between rounded-2xl p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tint}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="rounded-full bg-[#F4F0EA] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#57534E]">
                    {card.pct}%
                  </span>
                </div>

                <h3 className="mt-3 font-display text-sm font-bold text-[#1C1917]">
                  {t.mySpace.budget.buckets[card.key]}
                </h3>
                <p className="text-[11px] text-[#78716C]">
                  {t.mySpace.budget.bucketDescriptions[card.key]}
                </p>

                <p
                  className={`mt-3 font-display text-2xl font-bold tabular-nums ${
                    card.balance < 0 ? "text-[#C86D51]" : "text-[#1C1917]"
                  }`}
                >
                  {formatCurrency(card.balance)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openDisbursementModal(card.key)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E7E1D8] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#1C1917] transition hover:bg-[#F3EFE9] cursor-pointer"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-[#78716C]" />
                <span>{card.actionLabel}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Free to Spend vs. Recurring Bills Summary */}
      <section className="surface-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[#1C1917]">
            {t.mySpace.budget.freeToSpendSummaryTitle}
          </h3>
          {dueAutoBills.length > 0 && (
            <button
              type="button"
              onClick={() => void handleApplyDueAutoBills()}
              disabled={applyingAllAuto}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9F2EE] px-3 py-1.5 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer disabled:opacity-60"
            >
              {applyingAllAuto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>
                {t.mySpace.budget.applyDueAutoBills} ({dueAutoBills.length})
              </span>
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3.5">
            <p className="text-xs font-medium text-[#6B655E]">
              {t.mySpace.budget.currentFreeToSpend}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#1C1917]">
              {formatCurrency(balances.free_to_spend)}
            </p>
          </div>
          <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3.5">
            <p className="text-xs font-medium text-[#6B655E]">
              {t.mySpace.budget.upcomingRecurringTotal}
            </p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#C86D51]">
              -{formatCurrency(upcomingRecurringTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-[#D4E3DC] bg-[#F4FAF7] p-3.5">
            <p className="text-xs font-semibold text-[#234738]">
              {t.mySpace.budget.netAfterRecurring}
            </p>
            <p
              className={`mt-1 font-display text-xl font-bold tabular-nums ${
                netAfterRecurring >= 0 ? "text-[#2D5A47]" : "text-[#C86D51]"
              }`}
            >
              {formatCurrency(netAfterRecurring)}
            </p>
          </div>
        </div>
      </section>

      {/* Recurring Expenses & Ledger Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recurring Expenses & Subscriptions */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 text-[#2D5A47]" />
                <h3 className="font-display text-base font-bold text-[#1C1917]">
                  {t.mySpace.budget.recurringTitle}
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-[#6B655E]">
                {t.mySpace.budget.recurringSubtitle}
              </p>
            </div>
            <button
              type="button"
              id="add-recurring-expense-btn"
              onClick={() => openRecurringModal()}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#E9F2EE] px-3 py-1.5 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.common.create}</span>
            </button>
          </div>

          <div className="mt-4">
            {recurringExpenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] p-6 text-center">
                <p className="text-xs leading-relaxed text-[#6B655E]">
                  {t.mySpace.budget.noRecurringYet}
                </p>
                <button
                  type="button"
                  onClick={() => openRecurringModal()}
                  className="btn-secondary mt-3 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.mySpace.budget.addRecurring}</span>
                </button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recurringExpenses.map((bill) => {
                  const isPaidThisMonth = bill.last_paid_month === monthKey;
                  const isBusy = applyingRecurringId === bill.id;
                  return (
                    <li
                      key={bill.id}
                      className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/75 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1C1917]">
                            {bill.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#78716C]">
                            {t.mySpace.budget.frequencies[bill.frequency]} ·{" "}
                            {t.mySpace.budget.dueDayPrefix} {bill.billing_day}
                            {bill.auto_apply ? " · Auto" : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-[#1C1917]">
                          {formatCurrency(Number(bill.amount))}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        {isPaidThisMonth ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F2EE] px-2.5 py-1 text-[11px] font-semibold text-[#234738]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t.mySpace.budget.paidThisMonth}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkRecurringPaid(bill)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#2D5A47] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#234738] cursor-pointer disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            <span>{t.mySpace.budget.markPaid}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openRecurringModal(bill)}
                            className="rounded-lg p-1 text-[#78716C] transition hover:bg-white hover:text-[#1C1917] cursor-pointer"
                            aria-label={t.common.edit}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRecurring(bill.id)}
                            className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                            aria-label={t.common.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Personal Ledger History */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-[#1C1917]">
              {t.mySpace.budget.recentActivityTitle}
            </h3>

            <div className="inline-flex rounded-lg border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHistoryTab("disbursements")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  historyTab === "disbursements"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.mySpace.budget.disbursementsTab}
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab("income")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  historyTab === "income"
                    ? "bg-white text-[#1C1917] shadow-2xs"
                    : "text-[#6B655E]"
                }`}
              >
                {t.mySpace.budget.incomeHistoryTab}
              </button>
            </div>
          </div>

          <div className="mt-4">
            {historyTab === "income" ? (
              incomeEntries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] py-10 text-center text-xs text-[#6B655E]">
                  {t.mySpace.budget.noIncomeYet}
                </p>
              ) : (
                <ul className="divide-y divide-[#EFEAE2]">
                  {incomeEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1C1917]">
                            {entry.source}
                          </p>
                          <p className="mt-0.5 text-xs text-[#78716C]">
                            {formatDate(entry.entry_date)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-display text-sm font-bold tabular-nums text-[#2D5A47]">
                            +{formatCurrency(Number(entry.amount))}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDeleteIncome(entry.id)}
                            className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                            aria-label={t.common.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
                        <span className="rounded-lg bg-[#FAF4E6] px-2 py-1 tabular-nums text-[#855F1C]">
                          {t.mySpace.budget.buckets.tithing}:{" "}
                          {formatCurrency(Number(entry.tithing_amount))}
                        </span>
                        <span className="rounded-lg bg-[#EBF2F8] px-2 py-1 tabular-nums text-[#284D72]">
                          {t.mySpace.budget.buckets.investment}:{" "}
                          {formatCurrency(Number(entry.investment_amount))}
                        </span>
                        <span className="rounded-lg bg-[#E9F2EE] px-2 py-1 tabular-nums text-[#234738]">
                          {t.mySpace.budget.buckets.savings}:{" "}
                          {formatCurrency(Number(entry.savings_amount))}
                        </span>
                        <span className="rounded-lg bg-[#FBF0EC] px-2 py-1 tabular-nums text-[#9A4B33]">
                          {t.mySpace.budget.buckets.free_to_spend}:{" "}
                          {formatCurrency(Number(entry.free_to_spend_amount))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : transactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#DFD8CE] bg-[#FAF8F5] py-10 text-center text-xs text-[#6B655E]">
                {t.mySpace.budget.noDisbursementsYet}
              </p>
            ) : (
              <ul className="divide-y divide-[#EFEAE2]">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F4F0EA] px-2 py-0.5 text-[11px] font-semibold text-[#57534E]">
                          {t.mySpace.budget.buckets[tx.bucket]}
                        </span>
                        <span className="text-xs text-[#78716C]">
                          {formatDate(tx.transaction_date)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-[#1C1917]">
                        {tx.title}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-display text-sm font-bold tabular-nums text-[#C86D51]">
                        -{formatCurrency(Number(tx.amount))}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTx(tx.id)}
                        className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Modal 1: Bucket Allocation Percentages */}
      <Modal
        open={splitsOpen}
        onClose={() => setSplitsOpen(false)}
        title={t.mySpace.budget.splitsModalTitle}
        subtitle={t.mySpace.budget.splitsModalSubtitle}
      >
        <form
          onSubmit={handleSaveSplits}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <label
                htmlFor="split-tithing-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.budget.buckets.tithing} (%)
              </label>
              <input
                id="split-tithing-input"
                type="number"
                min={10}
                max={80}
                step="0.5"
                required
                value={tithingDraft}
                onChange={(e) => setTithingDraft(e.target.value)}
                className="input-base tabular-nums"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="split-investment-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.budget.buckets.investment} (%)
              </label>
              <input
                id="split-investment-input"
                type="number"
                min={10}
                max={80}
                step="0.5"
                required
                value={investmentDraft}
                onChange={(e) => setInvestmentDraft(e.target.value)}
                className="input-base tabular-nums"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="split-savings-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.budget.buckets.savings} (%)
              </label>
              <input
                id="split-savings-input"
                type="number"
                min={10}
                max={80}
                step="0.5"
                required
                value={savingsDraft}
                onChange={(e) => setSavingsDraft(e.target.value)}
                className="input-base tabular-nums"
              />
            </div>
          </div>

          <div
            className={`flex items-center justify-between rounded-xl border p-3.5 text-sm ${
              draftFreeToSpendPct < 0
                ? "border-[#F1C9BE] bg-[#FDF5F3] text-[#8F3A24]"
                : "border-[#D4E3DC] bg-[#F4FAF7] text-[#234738]"
            }`}
          >
            <span className="font-semibold">
              {t.mySpace.budget.buckets.free_to_spend}
            </span>
            <span className="font-display text-base font-bold tabular-nums">
              {draftFreeToSpendPct}%
            </span>
          </div>

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setSplitsOpen(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={savingSplits || draftFreeToSpendPct < 0}
              className="btn-primary w-full sm:w-auto"
            >
              {savingSplits ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Personal Income (Auto-Split) */}
      <Modal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        title={t.mySpace.budget.incomeModalTitle}
      >
        <form
          onSubmit={handleSaveIncome}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          <div className="min-w-0">
            <label
              htmlFor="personal-income-source"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.budget.incomeSourceLabel}
            </label>
            <input
              id="personal-income-source"
              type="text"
              required
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder={t.mySpace.budget.incomeSourcePlaceholder}
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="personal-income-amount"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.budget.incomeAmountLabel} (USD)
              </label>
              <input
                id="personal-income-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="0.00"
                className="input-base tabular-nums"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="personal-income-date"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.dateLabel}
              </label>
              <input
                id="personal-income-date"
                type="date"
                required
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border"
              />
            </div>
          </div>

          {/* Live Split Preview */}
          <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#6B655E] uppercase">
              {t.mySpace.budget.splitPreviewTitle}
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#EFEAE2]">
                <span className="text-[#57534E]">
                  {t.mySpace.budget.buckets.tithing} ({settings.tithing_pct}%)
                </span>
                <strong className="tabular-nums text-[#855F1C]">
                  {formatCurrency(liveIncomeSplit.tithing)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#EFEAE2]">
                <span className="text-[#57534E]">
                  {t.mySpace.budget.buckets.investment} (
                  {settings.investment_pct}%)
                </span>
                <strong className="tabular-nums text-[#284D72]">
                  {formatCurrency(liveIncomeSplit.investment)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#EFEAE2]">
                <span className="text-[#57534E]">
                  {t.mySpace.budget.buckets.savings} ({settings.savings_pct}%)
                </span>
                <strong className="tabular-nums text-[#234738]">
                  {formatCurrency(liveIncomeSplit.savings)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#EFEAE2]">
                <span className="text-[#57534E]">
                  {t.mySpace.budget.buckets.free_to_spend} ({freeToSpendPct}%)
                </span>
                <strong className="tabular-nums text-[#9A4B33]">
                  {formatCurrency(liveIncomeSplit.freeToSpend)}
                </strong>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="personal-income-notes"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.budget.descriptionLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <input
              id="personal-income-notes"
              type="text"
              value={incomeNotes}
              onChange={(e) => setIncomeNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setIncomeOpen(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={savingIncome}
              className="btn-primary w-full sm:w-auto"
            >
              {savingIncome ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Record Bucket Disbursement / Expense */}
      <Modal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        title={t.mySpace.budget.disbursementModalTitle}
      >
        <form
          onSubmit={handleSaveTransaction}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          <div className="min-w-0">
            <label
              htmlFor="bucket-tx-bucket"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.budget.disbursementBucketLabel}
            </label>
            <select
              id="bucket-tx-bucket"
              value={txBucket}
              onChange={(e) => setTxBucket(e.target.value as PersonalBucket)}
              className="input-base"
            >
              <option value="tithing">
                {t.mySpace.budget.buckets.tithing} (
                {formatCurrency(balances.tithing)})
              </option>
              <option value="investment">
                {t.mySpace.budget.buckets.investment} (
                {formatCurrency(balances.investment)})
              </option>
              <option value="savings">
                {t.mySpace.budget.buckets.savings} (
                {formatCurrency(balances.savings)})
              </option>
              <option value="free_to_spend">
                {t.mySpace.budget.buckets.free_to_spend} (
                {formatCurrency(balances.free_to_spend)})
              </option>
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="bucket-tx-title"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.budget.disbursementTitleLabel}
            </label>
            <input
              id="bucket-tx-title"
              type="text"
              required
              value={txTitle}
              onChange={(e) => setTxTitle(e.target.value)}
              placeholder={t.mySpace.budget.disbursementTitlePlaceholder}
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="bucket-tx-amount"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.amountLabel} (USD)
              </label>
              <input
                id="bucket-tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0.00"
                className="input-base tabular-nums"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="bucket-tx-date"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.dateLabel}
              </label>
              <input
                id="bucket-tx-date"
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border"
              />
            </div>
          </div>

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setTxOpen(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={savingTx}
              className="btn-primary w-full sm:w-auto"
            >
              {savingTx ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Add / Edit Recurring Expense */}
      <Modal
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        title={
          editingRecurring
            ? t.mySpace.budget.editRecurring
            : t.mySpace.budget.addRecurring
        }
      >
        <form
          onSubmit={handleSaveRecurring}
          className="box-border w-full max-w-full min-w-0 space-y-4"
        >
          <div className="min-w-0">
            <label
              htmlFor="recurring-title-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.budget.recurringNameLabel}
            </label>
            <input
              id="recurring-title-input"
              type="text"
              required
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder={t.mySpace.budget.recurringNamePlaceholder}
              className="input-base"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="recurring-amount-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.budget.amountLabel} (USD)
              </label>
              <input
                id="recurring-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                placeholder="0.00"
                className="input-base tabular-nums"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="recurring-day-input"
                className="mb-1 block text-xs font-semibold text-[#57534E]"
              >
                {t.mySpace.budget.billingDayLabel}
              </label>
              <input
                id="recurring-day-input"
                type="number"
                min={1}
                max={31}
                required
                value={recBillingDay}
                onChange={(e) => setRecBillingDay(e.target.value)}
                className="input-base tabular-nums"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="recurring-frequency-select"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.mySpace.budget.frequencyLabel}
            </label>
            <select
              id="recurring-frequency-select"
              value={recFrequency}
              onChange={(e) =>
                setRecFrequency(e.target.value as RecurringFrequency)
              }
              className="input-base"
            >
              {(
                ["monthly", "biweekly", "weekly", "yearly"] as RecurringFrequency[]
              ).map((freq) => (
                <option key={freq} value={freq}>
                  {t.mySpace.budget.frequencies[freq]}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recAutoApply}
              onChange={(e) => setRecAutoApply(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D5CDC1] accent-[#2D5A47]"
            />
            <span className="min-w-0 text-xs">
              <span className="block font-semibold text-[#1C1917]">
                {t.mySpace.budget.autoApplyLabel}
              </span>
              <span className="mt-0.5 block text-[#6B655E]">
                {t.mySpace.budget.autoApplyHint}
              </span>
            </span>
          </label>

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setRecurringOpen(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={savingRecurring}
              className="btn-primary w-full sm:w-auto"
            >
              {savingRecurring ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
