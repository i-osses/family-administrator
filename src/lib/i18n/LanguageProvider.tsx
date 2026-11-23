"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/config";
import type { Language } from "@/types/database";
import { dictionaries, type Dictionary } from "./dictionaries";

const STORAGE_KEY = "family_admin_language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Dictionary;
  locale: string;
  formatCurrency: (amount: number) => string;
  formatDate: (
    dateInput: string | Date,
    options?: Intl.DateTimeFormatOptions
  ) => string;
  formatTime: (dateInput: string | Date) => string;
  translateBudgetCategory: (category: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function parseDateSafe(input: string | Date): Date {
  if (input instanceof Date) return input;
  // Handle YYYY-MM-DD dates in local timezone without UTC shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(input);
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // Sync from localStorage and Supabase profile asynchronously after hydration
  useEffect(() => {
    let cancelled = false;

    const syncLanguage = async () => {
      await Promise.resolve();
      if (cancelled) return;

      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "es") {
          setLanguageState(saved);
        }
      } catch {
        // Ignore storage access errors
      }

      const { isConfigured } = getSupabaseEnv();
      if (!isConfigured) return;

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .maybeSingle();

        if (
          !cancelled &&
          (profile?.preferred_language === "en" ||
            profile?.preferred_language === "es")
        ) {
          setLanguageState(profile.preferred_language);
          try {
            window.localStorage.setItem(
              STORAGE_KEY,
              profile.preferred_language
            );
          } catch {
            // Ignore
          }
        }
      } catch {
        // Ignore network/auth check errors on public pages
      }
    };

    void syncLanguage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLang: Language) => {
    setLanguageState(nextLang);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage errors
    }

    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) return;

    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return;
        await supabase
          .from("profiles")
          .update({ preferred_language: nextLang })
          .eq("id", user.id);
      })
      .catch(() => {
        // Ignore profile update errors
      });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "es" : "en");
  }, [language, setLanguage]);

  const locale = language === "es" ? "es-ES" : "en-US";
  const t = dictionaries[language];

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [locale]
  );

  const formatDate = useCallback(
    (
      dateInput: string | Date,
      options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    ) => {
      const date = parseDateSafe(dateInput);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(locale, options).format(date);
    },
    [locale]
  );

  const formatTime = useCallback(
    (dateInput: string | Date) => {
      const date = parseDateSafe(dateInput);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
    },
    [locale]
  );

  const translateBudgetCategory = useCallback(
    (category: string) => {
      const normalized = category.toLowerCase();
      return t.budget.categories[normalized] ?? category;
    },
    [t]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      locale,
      formatCurrency,
      formatDate,
      formatTime,
      translateBudgetCategory,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      t,
      locale,
      formatCurrency,
      formatDate,
      formatTime,
      translateBudgetCategory,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
