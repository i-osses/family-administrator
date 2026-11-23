"use client";

import React, { useState } from "react";
import { Home, Loader2, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { useToast } from "@/components/ui/ToastProvider";

export function NoFamilyState() {
  const { t } = useLanguage();
  const { createFamily } = useFamily();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createFamily(name);
      setName("");
      showToast(t.family.familyCreatedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="surface-elevated rounded-3xl p-7 text-center sm:p-9">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F2EE] text-[#2D5A47]">
          <Home className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#1C1917]">
          {t.overview.noFamilyTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
          {t.overview.noFamilySubtitle}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
          <label
            htmlFor="onboarding-family-name"
            className="block text-xs font-semibold text-[#57534E]"
          >
            {t.family.familyNameLabel}
          </label>
          <input
            id="onboarding-family-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.overview.familyNamePlaceholder}
            className="input-base"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="btn-primary w-full py-2.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.common.creating}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>{t.overview.createFirstFamily}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
