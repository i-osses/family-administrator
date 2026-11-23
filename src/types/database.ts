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
