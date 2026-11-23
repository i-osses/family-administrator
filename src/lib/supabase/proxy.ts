import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    // Allow landing/login/invite pages to render helpful setup instructions when env vars are missing
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("setup", "missing");
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const fullTarget = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", fullTarget);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const nextParam = request.nextUrl.searchParams.get("next");
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/dashboard";
    const destination = request.nextUrl.clone();
    const parsed = new URL(safeNext, request.url);
    destination.pathname = parsed.pathname;
    destination.search = parsed.search;
    return NextResponse.redirect(destination);
  }

  return supabaseResponse;
}
