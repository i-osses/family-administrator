export const COLOR_SWATCHES = [
  "#2D5A47", // Sage forest
  "#3B6998", // Slate blue
  "#C86D51", // Warm terracotta
  "#B8862D", // Soft ochre
  "#9E4F73", // Dusty plum
  "#2C7A7B", // Deep teal
  "#6B5B95", // Muted indigo
  "#78716C", // Warm stone
] as const;

export const LEGACY_CALENDAR_COLORS: Record<string, string> = {
  family: "#2D5A47",
  school: "#3B6998",
  health: "#C86D51",
  chores: "#B8862D",
  celebration: "#9E4F73",
  travel: "#2C7A7B",
  church: "#9E4F73",
  activities: "#C86D51",
  other: "#78716C",
};

export function resolveCategoryColor(
  categoryName: string,
  explicitColor?: string | null
): string {
  if (explicitColor && /^#[0-9a-fA-F]{6}$/.test(explicitColor)) {
    return explicitColor;
  }
  const key = categoryName.trim().toLowerCase();
  if (LEGACY_CALENDAR_COLORS[key]) {
    return LEGACY_CALENDAR_COLORS[key];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COLOR_SWATCHES[hash % COLOR_SWATCHES.length];
}

export function getCalendarCategoryStyle(category: string) {
  const key = category.toLowerCase();
  const presets: Record<
    string,
    { dotClass: string; badgeClass: string; borderClass: string }
  > = {
    family: {
      dotClass: "bg-[#2D5A47]",
      badgeClass: "bg-[#E9F2EE] text-[#214637] border-[#C9DED5]",
      borderClass: "border-l-[#2D5A47]",
    },
    school: {
      dotClass: "bg-[#3B6998]",
      badgeClass: "bg-[#EBF2F8] text-[#284D72] border-[#C9DBEB]",
      borderClass: "border-l-[#3B6998]",
    },
    health: {
      dotClass: "bg-[#C86D51]",
      badgeClass: "bg-[#FBF0EC] text-[#9A4B33] border-[#F0CFC4]",
      borderClass: "border-l-[#C86D51]",
    },
    chores: {
      dotClass: "bg-[#B8862D]",
      badgeClass: "bg-[#FAF4E6] text-[#855F1C] border-[#EAD9B0]",
      borderClass: "border-l-[#B8862D]",
    },
    celebration: {
      dotClass: "bg-[#9E4F73]",
      badgeClass: "bg-[#F8ECF2] text-[#7A3555] border-[#E6C7D6]",
      borderClass: "border-l-[#9E4F73]",
    },
    travel: {
      dotClass: "bg-[#2C7A7B]",
      badgeClass: "bg-[#E9F5F5] text-[#1E5B5C] border-[#C4E1E1]",
      borderClass: "border-l-[#2C7A7B]",
    },
  };
  return (
    presets[key] ?? {
      dotClass: "bg-[#78716C]",
      badgeClass: "bg-[#F4F2EF] text-[#57534E] border-[#DFDAD3]",
      borderClass: "border-l-[#78716C]",
    }
  );
}

export const EXPENSE_CATEGORIES = [
  "housing",
  "groceries",
  "utilities",
  "transportation",
  "healthcare",
  "education",
  "dining",
  "entertainment",
  "savings",
  "other",
] as const;

export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "investments",
  "gifts",
  "refunds",
  "other",
] as const;

export const DEFAULT_BANNER_URL = "/images/family-home-hero.jpg";
