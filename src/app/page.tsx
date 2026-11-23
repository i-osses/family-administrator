import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { LandingView } from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { isConfigured } = getSupabaseEnv();

  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return <LandingView />;
}
