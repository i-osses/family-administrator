export type Language = "en" | "es";

export type FamilyRole = "admin" | "member";

export type InvitationStatus = "pending" | "accepted" | "expired";

export type CalendarCategory =
  | "family"
  | "school"
  | "health"
  | "chores"
  | "celebration"
  | "travel"
  | "other";

export type BudgetType = "income" | "expense";

export type FeedPostType =
  | "memory"
  | "photo"
  | "youtube"
  | "milestone"
  | "event";

export type FeedReactionType = "heart" | "celebrate";

export type PersonalBucket =
  | "tithing"
  | "investment"
  | "savings"
  | "free_to_spend";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly";

export type HabitKind = "habit" | "task";

export type HabitCadence = "daily" | "weekly" | "once";

export type HabitCategory =
  | "spiritual"
  | "study"
  | "music"
  | "health"
  | "personal"
  | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: Language;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  created_by: string | null;
  spotlight_banner_url: string | null;
  created_at: string;
}

export interface FamilyModuleSettings {
  family_id: string;
  show_calendar: boolean;
  show_family_feed: boolean;
  show_family_budget: boolean;
  show_quick_actions: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
}

export interface FamilyMemberWithProfile extends FamilyMember {
  profile: Profile | null;
}

export interface FamilyWithRole extends Family {
  role: FamilyRole;
  member_count?: number;
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  invited_email: string;
  role: FamilyRole;
  token: string;
  status: InvitationStatus;
  invited_by: string | null;
  created_at: string;
}

export interface InvitationPreview {
  id: string;
  family_id: string;
  family_name: string;
  spotlight_banner_url: string | null;
  invited_email: string;
  role: FamilyRole;
  status: InvitationStatus;
  inviter_name: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  category: CalendarCategory;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ActivityMemory {
  id: string;
  family_id: string;
  title: string;
  notes: string | null;
  activity_date: string;
  tags: string[];
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FamilyFeedPost {
  id: string;
  family_id: string;
  author_id: string | null;
  post_type: FeedPostType;
  title: string;
  body: string | null;
  activity_date: string;
  tags: string[];
  photo_url: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  milestone_label: string | null;
  calendar_event_id: string | null;
  created_at: string;
}

export interface FamilyFeedReaction {
  id: string;
  post_id: string;
  family_id: string;
  user_id: string;
  reaction_type: FeedReactionType;
  created_at: string;
}

export interface FamilyFeedComment {
  id: string;
  post_id: string;
  family_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface BudgetEntry {
  id: string;
  family_id: string;
  type: BudgetType;
  category: string;
  amount: number;
  description: string | null;
  entry_date: string;
  created_by: string | null;
  created_at: string;
}

export interface PersonalBudgetSettings {
  user_id: string;
  tithing_pct: number;
  investment_pct: number;
  savings_pct: number;
  updated_at: string;
}

export interface PersonalIncomeEntry {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  tithing_pct: number;
  investment_pct: number;
  savings_pct: number;
  tithing_amount: number;
  investment_amount: number;
  savings_amount: number;
  free_to_spend_amount: number;
  entry_date: string;
  notes: string | null;
  created_at: string;
}

export interface PersonalRecurringExpense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  frequency: RecurringFrequency;
  billing_day: number;
  auto_apply: boolean;
  last_paid_month: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PersonalBucketTransaction {
  id: string;
  user_id: string;
  bucket: PersonalBucket;
  title: string;
  amount: number;
  transaction_date: string;
  notes: string | null;
  recurring_expense_id: string | null;
  created_at: string;
}

export interface PersonalHabit {
  id: string;
  user_id: string;
  title: string;
  kind: HabitKind;
  cadence: HabitCadence;
  category: HabitCategory;
  reminder_time: string | null;
  due_date: string | null;
  private_notes: string | null;
  allow_milestone_share: boolean;
  current_streak: number;
  best_streak: number;
  completed_dates: string[];
  is_completed: boolean;
  created_at: string;
}
