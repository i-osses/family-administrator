import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  getSupabaseServiceRoleEnv,
} from "@/lib/supabase/admin";
import type { FamilyRole, Language } from "@/types/database";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      familyId?: string;
      email?: string;
      role?: FamilyRole;
      language?: Language;
    };

    const familyId = body.familyId?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const role: FamilyRole = body.role === "admin" ? "admin" : "member";
    const language: Language = body.language === "es" ? "es" : "en";

    if (!UUID_REGEX.test(familyId)) {
      return NextResponse.json(
        { error: "Invalid family ID." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Verify caller belongs to this family
    const { data: membership, error: memberError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to invite members to this family.",
        },
        { status: 403 }
      );
    }

    const { data: family } = await supabase
      .from("families")
      .select("id, name")
      .eq("id", familyId)
      .single();

    if (!family) {
      return NextResponse.json(
        { error: "Family not found." },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(24).toString("hex");

    const { data: invitation, error: insertError } = await supabase
      .from("family_invitations")
      .insert({
        family_id: familyId,
        invited_email: email,
        role,
        token,
        status: "pending",
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError || !invitation) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create invitation." },
        { status: 500 }
      );
    }

    const requestOrigin = new URL(request.url).origin;
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() || requestOrigin
    ).replace(/\/$/, "");
    const invitePath = `/invite/${invitation.token}`;
    const inviteUrl = `${appUrl}${invitePath}`;
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(
      invitePath
    )}`;

    let emailSent = false;
    let alreadyRegistered = false;
    let deliveryNote: string | null = null;

    const { isAdminConfigured } = getSupabaseServiceRoleEnv();

    if (isAdminConfigured) {
      const supabaseAdmin = createAdminClient();
      const { error: inviteErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            invited_family_id: familyId,
            invited_family_name: family.name,
            invitation_token: invitation.token,
            preferred_language: language,
          },
        });

      if (!inviteErr) {
        emailSent = true;
      } else {
        const lowerMsg = inviteErr.message.toLowerCase();
        const isExistingUser =
          lowerMsg.includes("already been registered") ||
          lowerMsg.includes("already registered") ||
          lowerMsg.includes("already exists") ||
          inviteErr.status === 422;

        if (isExistingUser) {
          alreadyRegistered = true;
          // Fall back gracefully for existing Supabase Auth accounts via native magic-link email
          const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: redirectTo,
              shouldCreateUser: false,
            },
          });

          if (!otpError) {
            emailSent = true;
          } else {
            deliveryNote = otpError.message;
          }
        } else {
          deliveryNote = inviteErr.message;
        }
      }
    }

    return NextResponse.json({
      invitation,
      inviteUrl,
      emailSent,
      alreadyRegistered,
      deliveryNote,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
