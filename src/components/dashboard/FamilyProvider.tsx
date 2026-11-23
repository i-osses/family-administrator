"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  FamilyMemberWithProfile,
  FamilyRole,
  FamilyWithRole,
  Profile,
} from "@/types/database";

const ACTIVE_FAMILY_KEY = "family_admin_active_family";

interface FamilyContextValue {
  profile: Profile;
  families: FamilyWithRole[];
  activeFamily: FamilyWithRole | null;
  activeFamilyId: string | null;
  setActiveFamilyId: (familyId: string) => void;
  members: FamilyMemberWithProfile[];
  loadingFamilies: boolean;
  loadingMembers: boolean;
  refreshFamilies: (preferredFamilyId?: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  createFamily: (name: string) => Promise<FamilyWithRole | null>;
  signOut: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

interface MembershipRow {
  role: FamilyRole;
  family: {
    id: string;
    name: string;
    created_by: string | null;
    spotlight_banner_url: string | null;
    created_at: string;
  } | null;
}

interface RawMemberRow {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  profile: Profile | Profile[] | null;
}

export function FamilyProvider({
  initialProfile,
  children,
}: {
  initialProfile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile] = useState<Profile>(initialProfile);
  const [families, setFamilies] = useState<FamilyWithRole[]>([]);
  const [activeFamilyId, setActiveFamilyIdState] = useState<string | null>(
    null
  );
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const setActiveFamilyId = useCallback((familyId: string) => {
    setActiveFamilyIdState(familyId);
    try {
      window.localStorage.setItem(ACTIVE_FAMILY_KEY, familyId);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const refreshFamilies = useCallback(
    async (preferredFamilyId?: string) => {
      await Promise.resolve();
      setLoadingFamilies(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("family_members")
          .select(
            "role, family:families(id, name, created_by, spotlight_banner_url, created_at)"
          )
          .eq("user_id", profile.id)
          .order("joined_at", { ascending: true });

        if (error) {
          console.error("Failed to load families:", error.message);
          setFamilies([]);
          return;
        }

        const rows = (data as unknown as MembershipRow[]) ?? [];
        const parsed: FamilyWithRole[] = rows
          .filter((row) => row.family !== null)
          .map((row) => ({
            ...row.family!,
            role: row.role,
          }));

        setFamilies(parsed);

        let storedId: string | null = null;
        try {
          storedId = window.localStorage.getItem(ACTIVE_FAMILY_KEY);
        } catch {
          storedId = null;
        }

        const candidateId = preferredFamilyId || storedId;
        const matched = parsed.find((f) => f.id === candidateId);

        if (matched) {
          setActiveFamilyIdState(matched.id);
          try {
            window.localStorage.setItem(ACTIVE_FAMILY_KEY, matched.id);
          } catch {
            // Ignore
          }
        } else if (parsed.length > 0) {
          setActiveFamilyIdState(parsed[0].id);
          try {
            window.localStorage.setItem(ACTIVE_FAMILY_KEY, parsed[0].id);
          } catch {
            // Ignore
          }
        } else {
          setActiveFamilyIdState(null);
        }
      } finally {
        setLoadingFamilies(false);
      }
    },
    [profile.id]
  );

  const refreshMembers = useCallback(async () => {
    await Promise.resolve();
    if (!activeFamilyId) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("family_members")
        .select(
          "id, family_id, user_id, role, joined_at, profile:profiles(id, email, full_name, avatar_url, preferred_language, created_at)"
        )
        .eq("family_id", activeFamilyId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Failed to load members:", error.message);
        setMembers([]);
        return;
      }

      const rawRows = (data as unknown as RawMemberRow[]) ?? [];
      const normalized: FamilyMemberWithProfile[] = rawRows.map((row) => ({
        id: row.id,
        family_id: row.family_id,
        user_id: row.user_id,
        role: row.role,
        joined_at: row.joined_at,
        profile: Array.isArray(row.profile)
          ? (row.profile[0] ?? null)
          : row.profile,
      }));
      setMembers(normalized);
    } finally {
      setLoadingMembers(false);
    }
  }, [activeFamilyId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshFamilies();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshFamilies]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshMembers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMembers]);

  const createFamily = useCallback(
    async (name: string): Promise<FamilyWithRole | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("families")
        .insert({
          name: trimmed,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Failed to create family");
      }

      await refreshFamilies(data.id);

      return {
        ...data,
        role: "admin",
      };
    },
    [profile.id, refreshFamilies]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      window.localStorage.removeItem(ACTIVE_FAMILY_KEY);
    } catch {
      // Ignore
    }
    router.push("/login");
    router.refresh();
  }, [router]);

  const activeFamily = useMemo(
    () => families.find((f) => f.id === activeFamilyId) ?? null,
    [families, activeFamilyId]
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      profile,
      families,
      activeFamily,
      activeFamilyId,
      setActiveFamilyId,
      members,
      loadingFamilies,
      loadingMembers,
      refreshFamilies,
      refreshMembers,
      createFamily,
      signOut,
    }),
    [
      profile,
      families,
      activeFamily,
      activeFamilyId,
      setActiveFamilyId,
      members,
      loadingFamilies,
      loadingMembers,
      refreshFamilies,
      refreshMembers,
      createFamily,
      signOut,
    ]
  );

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return ctx;
}
