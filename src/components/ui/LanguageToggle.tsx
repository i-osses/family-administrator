"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.common.languageLabel}
      className="inline-flex items-center rounded-full border border-[#DFD8CE] bg-[#F4F0EA] p-0.5 text-xs font-semibold"
    >
      <button
        type="button"
        id="lang-toggle-en"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
          language === "en"
            ? "bg-white text-[#1C1917] shadow-xs"
            : "text-[#6B655E] hover:text-[#1C1917]"
        }`}
        aria-pressed={language === "en"}
      >
        {compact ? "EN" : "EN"}
      </button>
      <button
        type="button"
        id="lang-toggle-es"
        onClick={() => setLanguage("es")}
        className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
          language === "es"
            ? "bg-white text-[#1C1917] shadow-xs"
            : "text-[#6B655E] hover:text-[#1C1917]"
        }`}
        aria-pressed={language === "es"}
      >
        {compact ? "ES" : "ES"}
      </button>
    </div>
  );
}
