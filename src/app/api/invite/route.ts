import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import type { FamilyRole, Language } from "@/types/database";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInvitationEmail({
  familyName,
  inviterName,
  role,
  inviteUrl,
  language,
}: {
  familyName: string;
  inviterName: string;
  role: FamilyRole;
  inviteUrl: string;
  language: Language;
}) {
  const safeFamily = escapeHtml(familyName);
  const safeInviter = escapeHtml(inviterName);
  const safeUrl = escapeHtml(inviteUrl);

  if (language === "es") {
    const roleLabel = role === "admin" ? "Administrador" : "Miembro";
    return {
      subject: `${inviterName} te invitó a unirte a ${familyName} en Administrador Familiar`,
      text: `${inviterName} te ha invitado a unirte al hogar "${familyName}" como ${roleLabel}.\n\nAcepta tu invitación aquí: ${inviteUrl}\n`,
      html: `
        <div style="background-color:#FAF8F5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1C1917;">
          <div style="max-width:540px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E1D8;border-radius:16px;overflow:hidden;">
            <div style="background:#2D5A47;padding:24px 28px;color:#FFFFFF;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">Administrador Familiar</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Te han invitado a ${safeFamily}</h1>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44403C;">
                <strong>${safeInviter}</strong> te invitó a unirte a <strong>${safeFamily}</strong> con el rol de <strong>${roleLabel}</strong> para compartir el calendario familiar, guardar recuerdos y coordinar el presupuesto del hogar.
              </p>
              <div style="margin:24px 0;">
                <a href="${safeUrl}" style="display:inline-block;background:#2D5A47;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
                  Aceptar invitación
                </a>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#78716C;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                <a href="${safeUrl}" style="color:#2D5A47;word-break:break-all;">${safeUrl}</a>
              </p>
            </div>
          </div>
        </div>
      `,
    };
  }

  const roleLabel = role === "admin" ? "Admin" : "Member";
  return {
    subject: `${inviterName} invited you to join ${familyName} on Family Administrator`,
    text: `${inviterName} invited you to join the "${familyName}" household as a ${roleLabel}.\n\nAccept your invitation here: ${inviteUrl}\n`,
    html: `
      <div style="background-color:#FAF8F5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1C1917;">
        <div style="max-width:540px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E1D8;border-radius:16px;overflow:hidden;">
          <div style="background:#2D5A47;padding:24px 28px;color:#FFFFFF;">
            <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">Family Administrator</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">You're invited to ${safeFamily}</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44403C;">
              <strong>${safeInviter}</strong> invited you to join <strong>${safeFamily}</strong> as a <strong>${roleLabel}</strong> to coordinate your shared calendar, family memories, and household budget.
            </p>
            <div style="margin:24px 0;">
              <a href="${safeUrl}" style="display:inline-block;background:#2D5A47;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
                Accept Invitation
              </a>
            </div>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#78716C;">
              If the button doesn't work, copy and paste this link into your browser:<br />
              <a href="${safeUrl}" style="color:#2D5A47;word-break:break-all;">${safeUrl}</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

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

    // Confirm user belongs to this family and fetch family name
    const { data: membership, error: memberError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "You do not have permission to invite members to this family." },
        { status: 403 }
      );
    }

    const [{ data: family }, { data: inviterProfile }] = await Promise.all([
      supabase.from("families").select("id, name").eq("id", familyId).single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

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
    const inviteUrl = `${appUrl}/invite/${invitation.token}`;

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Family Administrator <onboarding@resend.dev>";

    let emailSent = false;
    let emailError: string | null = null;

    if (resendApiKey && !resendApiKey.includes("re_your_resend_api_key")) {
      const resend = new Resend(resendApiKey);
      const inviterName =
        inviterProfile?.full_name || inviterProfile?.email || user.email || "A family member";
      const template = buildInvitationEmail({
        familyName: family.name,
        inviterName,
        role,
        inviteUrl,
        language,
      });

      const { error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (sendError) {
        emailError = sendError.message;
      } else {
        emailSent = true;
      }
    }

    return NextResponse.json({
      invitation,
      inviteUrl,
      emailSent,
      emailError,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
