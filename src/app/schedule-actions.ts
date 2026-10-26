"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";
import {
  aiConfigured,
  aiModel,
  aiProvider,
  providerConsentMatches,
  aiFailureMessage,
  AIProviderError,
} from "@/lib/study-ai";
import {
  readScheduleAsset,
  extractScheduleFromProvider,
} from "@/lib/schedule-ai";
import {
  reviewedSchedule,
  validDate,
  validTerm,
  validTime,
  validTimezone,
  type ScheduleState,
} from "@/lib/schedule";
export async function analyzeSchedule(
  _previous: ScheduleState,
  form: FormData,
): Promise<ScheduleState> {
  const { supabase } = await requireUser();
  if (!aiConfigured())
    return {
      message:
        "AI schedule import is not enabled yet. You can add meetings manually.",
    };
  if (!providerConsentMatches(form))
    return {
      message:
        "Reload this page and confirm the current AI provider and data-sharing choice before continuing.",
    };
  const start = String(form.get("term_start") ?? ""),
    end = String(form.get("term_end") ?? ""),
    timezone = String(form.get("timezone") ?? "").trim();
  const file = form.get("schedule_file");
  if (
    !validTerm(start, end) ||
    !validTimezone(timezone) ||
    !(file instanceof File) ||
    file.size < 1 ||
    file.size > 4 * 1024 * 1024
  )
    return {
      message:
        "Choose a file up to 4 MB, valid term dates no more than one year apart, and a valid timezone.",
    };
  const readiness = await supabase
    .from("class_meetings")
    .select("id", { head: true })
    .limit(1);
  if (readiness.error)
    return {
      message:
        "Schedule import is not ready yet. You can continue with your existing workspace.",
    };
  const quota = await supabase.rpc("claim_ai_request_for_provider", {
    selected_provider: aiProvider(),
  });
  if (quota.error)
    return { message: "AI import is not ready yet. Please try again later." };
  if (!quota.data)
    return {
      message:
        "The AI beta limit has been reached. Wait at least a minute; the limits are 5 attempts per hour and 20 per UTC day.",
    };
  let asset;
  try {
    asset = await readScheduleAsset(file);
  } catch {
    return {
      message:
        "The file could not be read. Use an unencrypted PDF of up to 10 pages, PNG/JPEG/WebP image, or UTF-8 TXT/CSV of 40–12,000 characters. Maximum 4 MB. This attempt counts toward the beta limit.",
    };
  }
  try {
    const draft = await extractScheduleFromProvider(
      asset,
      start,
      end,
      timezone,
      process.env.DAYLANE_AI_API_KEY!.trim(),
      aiModel(),
    );
    return {
      message:
        "Draft ready. Check all dates, times, class matches, and source excerpts. Nothing has been saved.",
      draft,
      token: crypto.randomUUID(),
      termStart: start,
      termEnd: end,
      timezone,
    };
  } catch (error) {
    console.error("Daylane schedule extraction failed", {
      status: error instanceof AIProviderError ? error.status : undefined,
    });
    return {
      message:
        aiFailureMessage(error) +
        " Nothing was imported. This attempt counts toward the beta limit.",
    };
  }
}
export async function saveReviewedSchedule(
  _previous: { message: string },
  form: FormData,
): Promise<{ message: string }> {
  const { supabase } = await requireUser();
  const reviewed = reviewedSchedule(form);
  if ("error" in reviewed) return { message: reviewed.error };
  const { data, error } = await supabase.rpc("import_reviewed_schedule", {
    draft: reviewed.draft,
    chosen_start: reviewed.start,
    chosen_end: reviewed.end,
    chosen_timezone: reviewed.timezone,
    import_token: reviewed.token,
  });
  if (
    error ||
    !data ||
    typeof data.classes !== "number" ||
    typeof data.meetings !== "number" ||
    typeof data.assignments !== "number"
  )
    return {
      message:
        "The schedule was not confirmed saved. Check the entries and try again. A retry of this preview will not duplicate a completed import.",
    };
  ["/schedule", "/classes", "/assignments", "/dashboard"].forEach((p) =>
    revalidatePath(p),
  );
  redirect("/schedule?imported=1");
}
function uuid(value: unknown) {
  const id = String(value ?? "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new Error("Invalid meeting.");
  return id;
}
export async function saveMeeting(form: FormData) {
  const { supabase, user } = await requireUser();
  const class_id = uuid(form.get("class_id")),
    weekday = Number(form.get("weekday")),
    start_time = String(form.get("start_time") ?? ""),
    end_time = String(form.get("end_time") ?? ""),
    term_start = String(form.get("term_start") ?? ""),
    term_end = String(form.get("term_end") ?? ""),
    timezone = String(form.get("timezone") ?? "").trim();
  if (
    !Number.isInteger(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    !validTime(start_time) ||
    !validTime(end_time) ||
    end_time <= start_time ||
    !validDate(term_start) ||
    !validTerm(term_start, term_end) ||
    !validTimezone(timezone)
  )
    throw new Error("Check the meeting day, times, dates, and timezone.");
  const { data: course, error } = await supabase
    .from("classes")
    .select("id")
    .eq("id", class_id)
    .eq("user_id", user.id)
    .single();
  if (error || !course) throw new Error("Choose one of your classes.");
  const values = {
    class_id,
    weekday,
    start_time,
    end_time,
    term_start,
    term_end,
    timezone,
  };
  const id = form.get("meeting_id");
  const saved = id
    ? await supabase
        .from("class_meetings")
        .update(values)
        .eq("id", uuid(id))
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("class_meetings")
        .insert({ ...values, user_id: user.id })
        .select("id")
        .single();
  if (saved.error || !saved.data)
    throw new Error(
      "The meeting could not be saved. Check for an identical meeting.",
    );
  revalidatePath("/schedule");
  revalidatePath("/classes");
  redirect("/schedule");
}
export async function deleteMeeting(form: FormData) {
  const { supabase, user } = await requireUser();
  const result = await supabase
    .from("class_meetings")
    .delete()
    .eq("id", uuid(form.get("meeting_id")))
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (result.error || !result.data)
    throw new Error("The meeting could not be deleted.");
  revalidatePath("/schedule");
  revalidatePath("/classes");
}
