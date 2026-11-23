import type { CalendarCategory } from "@/types/database";

export const CALENDAR_CATEGORIES: {
  id: CalendarCategory;
  dotClass: string;
  badgeClass: string;
  borderClass: string;
}[] = [
  {
    id: "family",
    dotClass: "bg-[#2D5A47]",
    badgeClass: "bg-[#E9F2EE] text-[#214637] border-[#C9DED5]",
    borderClass: "border-l-[#2D5A47]",
  },
  {
    id: "school",
    dotClass: "bg-[#3B6998]",
    badgeClass: "bg-[#EBF2F8] text-[#284D72] border-[#C9DBEB]",
    borderClass: "border-l-[#3B6998]",
  },
  {
    id: "health",
    dotClass: "bg-[#C86D51]",
    badgeClass: "bg-[#FBF0EC] text-[#9A4B33] border-[#F0CFC4]",
    borderClass: "border-l-[#C86D51]",
  },
  {
    id: "chores",
    dotClass: "bg-[#B8862D]",
    badgeClass: "bg-[#FAF4E6] text-[#855F1C] border-[#EAD9B0]",
    borderClass: "border-l-[#B8862D]",
  },
  {
    id: "celebration",
    dotClass: "bg-[#9E4F73]",
    badgeClass: "bg-[#F8ECF2] text-[#7A3555] border-[#E6C7D6]",
    borderClass: "border-l-[#9E4F73]",
  },
  {
    id: "travel",
    dotClass: "bg-[#2C7A7B]",
    badgeClass: "bg-[#E9F5F5] text-[#1E5B5C] border-[#C4E1E1]",
    borderClass: "border-l-[#2C7A7B]",
  },
  {
    id: "other",
    dotClass: "bg-[#78716C]",
    badgeClass: "bg-[#F4F2EF] text-[#57534E] border-[#DFDAD3]",
    borderClass: "border-l-[#78716C]",
  },
];

export function getCalendarCategoryStyle(category: CalendarCategory) {
  return (
    CALENDAR_CATEGORIES.find((c) => c.id === category) ??
    CALENDAR_CATEGORIES[CALENDAR_CATEGORIES.length - 1]
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
