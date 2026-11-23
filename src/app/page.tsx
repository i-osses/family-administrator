import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { LandingView } from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { isConfigured } = getSupabaseEnv();
  let isSignedIn = false;

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isSignedIn = Boolean(user);
    } catch {
      isSignedIn = false;
    }
  }

  if (isSignedIn) {
    redirect("/dashboard");
  }

  return <LandingView />;
}
