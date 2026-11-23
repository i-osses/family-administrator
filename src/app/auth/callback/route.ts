import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam) return "/dashboard";
  if (nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = getSafeRedirectPath(searchParams.get("next"));

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Ensure a profile row exists even if the auth trigger was added after signup
      if (user) {
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email?.split("@")[0] ??
          "Member";
        const avatarUrl =
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null;

        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      }

      return NextResponse.redirect(`${baseUrl}${nextPath}`);
    }
  }

  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("error", "callback");
  if (nextPath !== "/dashboard") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}
