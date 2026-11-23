import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { LoginCard } from "@/components/auth/LoginCard";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Family Administrator with Google to manage your shared household.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; setup?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = params.next ?? "/dashboard";
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  const { isConfigured } = getSupabaseEnv();

  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(safeNext);
    }
  }

  return (
    <LoginCard
      nextPath={safeNext}
      errorCode={params.error}
      setupMissing={!isConfigured || params.setup === "missing"}
    />
  );
}
