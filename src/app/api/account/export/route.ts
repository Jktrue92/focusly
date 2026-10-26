import { readAll } from "@/lib/read-all";
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
  const [classes, assignments, decks, cards, progress, meetings, usage] =
    await Promise.all([
      readAll((start, end) =>
        supabase
          .from("classes")
          .select("id,name,color,created_at")
          .eq("user_id", user.id)
          .order("id")
          .range(start, end),
      ),
      readAll((start, end) =>
        supabase
          .from("assignments")
          .select("id,title,class_id,due_date,priority,completed,created_at")
          .eq("user_id", user.id)
          .order("id")
          .range(start, end),
      ),
      readAll((start, end) =>
        supabase
          .from("study_decks")
          .select("id,title,description,color,created_at")
          .eq("user_id", user.id)
          .order("id")
          .range(start, end),
      ),
      readAll((start, end) =>
        supabase
          .from("flashcards")
          .select("id,deck_id,term,definition,source_excerpt,created_at")
          .eq("user_id", user.id)
          .order("id")
          .range(start, end),
      ),
      readAll((start, end) =>
        supabase
          .from("flashcard_progress")
          .select("card_id,known,review_count,last_reviewed")
          .eq("user_id", user.id)
          .order("card_id")
          .range(start, end),
      ),
      readAll((start, end) =>
        supabase
          .from("class_meetings")
          .select(
            "id,class_id,weekday,start_time,end_time,term_start,term_end,timezone,created_at",
          )
          .eq("user_id", user.id)
          .order("id")
          .range(start, end),
      ),
      supabase.rpc("get_own_ai_usage"),
    ]);
  const optionalErrors = [
    decks.error,
    cards.error,
    progress.error,
    meetings.error,
    usage.error,
  ].filter(Boolean);
  const isMissing = (code: string) =>
    ["PGRST205", "PGRST202", "42P01", "42883"].includes(code);
  if (
    classes.error ||
    assignments.error ||
    optionalErrors.some((error) => error && !isMissing(error.code))
  )
    return NextResponse.json(
      { error: "Unable to export your workspace. Please try again." },
      { status: 500, headers: privacyHeaders },
    );
  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      age_13_or_older: user.user_metadata.age_13_or_older ?? null,
      privacy_policy_version: user.user_metadata.privacy_policy_version ?? null,
    },
    classes: classes.data,
    assignments: assignments.data,
    study: {
      available: !decks.error && !cards.error && !progress.error,
      decks: decks.data ?? [],
      flashcards: cards.data ?? [],
      progress: progress.data ?? [],
    },
    schedule: { available: !meetings.error, meetings: meetings.data ?? [] },
    ai_usage: usage.data ?? null,
  };
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, "utf8") > 4 * 1024 * 1024)
    return NextResponse.json(
      {
        error:
          "This export is too large for one download. Contact the privacy team for a complete copy.",
      },
      { status: 413, headers: privacyHeaders },
    );
  return new NextResponse(serialized, {
    headers: {
      ...privacyHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="daylane-data.json"',
    },
  });
}
