import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

export function getSupabaseServiceRoleEnv() {
  const { url, isConfigured } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return {
    url,
    serviceRoleKey,
    isAdminConfigured: Boolean(
      isConfigured &&
        serviceRoleKey &&
        !serviceRoleKey.includes("your-supabase-service-role-key")
    ),
  };
}

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
