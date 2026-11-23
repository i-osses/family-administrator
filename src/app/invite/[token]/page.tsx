import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import type { InvitationPreview } from "@/types/database";
import { InviteAcceptanceView } from "@/components/invite/InviteAcceptanceView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Family Invitation",
  description: "Accept your invitation to join a family on Family Administrator.",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { isConfigured } = getSupabaseEnv();

  let invitation: InvitationPreview | null = null;
  let isAuthenticated = false;
  let userEmail: string | null = null;

  if (isConfigured) {
    const supabase = await createClient();
    const [{ data: authData }, { data: rpcRows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("get_invitation_by_token", { invite_token: token }),
    ]);

    if (authData.user) {
      isAuthenticated = true;
      userEmail = authData.user.email ?? null;
    }

    if (Array.isArray(rpcRows) && rpcRows.length > 0) {
      invitation = rpcRows[0] as InvitationPreview;
    }
  }

  return (
    <InviteAcceptanceView
      token={token}
      invitation={invitation}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    />
  );
}
