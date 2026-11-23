import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim() ?? "";

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required." },
        { status: 400 }
      );
    }

    const { data: familyId, error: rpcError } = await supabase.rpc(
      "accept_family_invitation",
      { invite_token: token }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({ familyId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
