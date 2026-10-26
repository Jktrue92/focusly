import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
const privacyHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function GET() {
  if (!isConfigured())
    return NextResponse.json(
      { error: "Account export is unavailable." },
      { status: 503, headers: privacyHeaders },
    );
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return NextResponse.json(
      { error: "Sign in to download your information." },
      { status: 401, headers: privacyHeaders },
    );
  const [classes, assignments] = await Promise.all([
    supabase
      .from("classes")
      .select("id,name,color,created_at")
      .eq("user_id", user.id),
    supabase
      .from("assignments")
      .select("id,title,class_id,due_date,priority,completed,created_at")
      .eq("user_id", user.id),
  ]);
  if (classes.error || assignments.error)
    return NextResponse.json(
      { error: "Unable to export your workspace. Please try again." },
      { status: 500, headers: privacyHeaders },
    );
  return NextResponse.json(
    {
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        age_13_or_older: user.user_metadata.age_13_or_older ?? null,
        privacy_policy_version:
          user.user_metadata.privacy_policy_version ?? null,
      },
      classes: classes.data,
      assignments: assignments.data,
    },
    {
      headers: {
        ...privacyHeaders,
        "Content-Disposition": 'attachment; filename="focusly-data.json"',
      },
    },
  );
}
