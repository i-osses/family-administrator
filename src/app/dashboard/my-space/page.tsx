"use client";

import { useState } from "react";
import { Flame, Lock, ShieldCheck, Wallet } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PersonalBucketBudget } from "@/components/my-space/PersonalBucketBudget";
import { PersonalHabitsTasks } from "@/components/my-space/PersonalHabitsTasks";

export default function MySpacePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"budget" | "habits">("budget");

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FBF0EC] px-3 py-1 text-xs font-semibold text-[#9A4B33]">
          <Lock className="h-3.5 w-3.5" />
          <span>{t.common.privateBadge}</span>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.mySpace.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.mySpace.subtitle}</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[#EBDAD3] bg-[#FDF7F5] px-4 py-3 text-xs leading-relaxed text-[#7A3F2D]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C86D51]" />
          <p>{t.mySpace.privacyBanner}</p>
        </div>
      </header>

      {/* Sub-Navigation Tabs */}
      <div className="grid w-full max-w-md grid-cols-2 gap-1.5 rounded-2xl border border-[#E7E1D8] bg-[#F4F0EA] p-1">
        <button
          type="button"
          id="myspace-tab-budget"
          onClick={() => setActiveTab("budget")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm cursor-pointer ${
            activeTab === "budget"
              ? "bg-white text-[#1C1917] shadow-xs"
              : "text-[#6B655E] hover:text-[#1C1917]"
          }`}
        >
          <Wallet className="h-4 w-4 text-[#2D5A47]" />
          <span className="truncate">{t.mySpace.budgetTab}</span>
        </button>
        <button
          type="button"
          id="myspace-tab-habits"
          onClick={() => setActiveTab("habits")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm cursor-pointer ${
            activeTab === "habits"
              ? "bg-white text-[#1C1917] shadow-xs"
              : "text-[#6B655E] hover:text-[#1C1917]"
          }`}
        >
          <Flame className="h-4 w-4 text-[#C86D51]" />
          <span className="truncate">{t.mySpace.habitsTab}</span>
        </button>
      </div>

      {/* Active Personal Tool */}
      {activeTab === "budget" ? (
        <PersonalBucketBudget />
      ) : (
        <PersonalHabitsTasks />
      )}
    </div>
  );
}
