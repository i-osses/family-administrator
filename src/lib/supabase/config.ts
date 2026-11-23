export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  let hasValidUrl = false;
  if (url && !url.includes("your-project-ref")) {
    try {
      const parsed = new URL(url);
      hasValidUrl = parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      hasValidUrl = false;
    }
  }

  return {
    url,
    anonKey,
    isConfigured: Boolean(
      hasValidUrl && anonKey && !anonKey.includes("your-supabase-anon-key")
    ),
  };
}
