import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import type { Profile } from "@/types/database";
import { FamilyProvider } from "@/components/dashboard/FamilyProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) {
    redirect("/login?setup=missing");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const initialProfile: Profile = (existingProfile as Profile | null) ?? {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Member",
    avatar_url:
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null,
    preferred_language: "en",
    created_at: new Date().toISOString(),
  };

  return (
    <FamilyProvider initialProfile={initialProfile}>
      <DashboardShell>{children}</DashboardShell>
    </FamilyProvider>
  );
}
