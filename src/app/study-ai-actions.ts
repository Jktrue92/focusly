"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";
import {
  aiConfigured,
  aiFailureMessage,
  AIProviderError,
  generateStudyDraftFromProvider,
  type AIStudyState,
} from "@/lib/study-ai";
export async function generateStudyDraft(
  _previous: AIStudyState,
  form: FormData,
): Promise<AIStudyState> {
  const { supabase } = await requireUser();
  if (!aiConfigured())
    return {
      message:
        "The AI beta is not enabled yet. You can still make and study your own flashcards.",
    };
  if (form.get("ai_consent") !== "on")
    return {
      message:
        "Confirm that you are 13+ and choose to send these notes to OpenAI before continuing.",
    };
  const notes = String(form.get("notes") ?? "").trim();
  const count = Number(form.get("count"));
  if (notes.length < 100 || notes.length > 12000 || ![5, 10].includes(count))
    return {
      message:
        "Paste 100 to 12,000 characters of your own study notes and choose 5 or 10 cards.",
    };
  const quota = await supabase.rpc("claim_ai_request");
  if (quota.error)
    return {
      message: "The AI study tools are not ready yet. Please try again later.",
    };
  if (!quota.data)
    return {
      message:
        "You’ve reached the AI beta’s request limit. Wait at least a minute between attempts; the limits are 5 attempts per hour and 20 per UTC day.",
    };
  try {
    const draft = await generateStudyDraftFromProvider(
      notes,
      count,
      process.env.DAYLANE_AI_API_KEY!,
      process.env.DAYLANE_AI_MODEL || "gpt-4.1-mini",
    );
    return {
      message:
        "Draft ready. Check every answer and source excerpt before saving.",
      draft,
    };
  } catch (error) {
    console.error("Daylane AI generation failed", {
      status: error instanceof AIProviderError ? error.status : undefined,
    });
    return {
      message:
        aiFailureMessage(error) +
        " Your notes were not saved by Daylane. This attempt counts toward the beta limit.",
    };
  }
}
export async function saveStudyDraft(
  _previous: { message: string },
  form: FormData,
): Promise<{ message: string }> {
  const { supabase, user } = await requireUser();
  const deck_id = String(form.get("deck_id") ?? "");
  const count = Number(form.get("card_count"));
  if (form.get("review_confirmed") !== "on")
    return { message: "Review the selected cards and confirm before saving." };
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      deck_id,
    ) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 10
  )
    return { message: "Choose a study set and a valid draft." };
  const rows = [];
  for (let i = 0; i < count; i++) {
    if (form.get("include_card_" + i) !== "on") continue;
    const term = String(form.get("term_" + i) ?? "").trim();
    const definition = String(form.get("definition_" + i) ?? "").trim();
    const source_excerpt = String(form.get("source_" + i) ?? "").trim();
    if (
      !term ||
      term.length > 300 ||
      !definition ||
      definition.length > 2000 ||
      source_excerpt.length > 800
    )
      return { message: "Check the draft fields before saving." };
    rows.push({ deck_id, user_id: user.id, term, definition, source_excerpt });
  }
  if (!rows.length) return { message: "Choose at least one card to save." };
  const { data: deck, error } = await supabase
    .from("study_decks")
    .select("id")
    .eq("id", deck_id)
    .eq("user_id", user.id)
    .single();
  if (error || !deck) return { message: "This study set is unavailable." };
  const existing = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("deck_id", deck_id)
    .eq("user_id", user.id);
  if (
    existing.error ||
    existing.count === null ||
    existing.count + rows.length > 200
  )
    return {
      message: "Choose another set. Each set supports up to 200 cards.",
    };
  const saved = await supabase.from("flashcards").insert(rows);
  if (saved.error)
    return {
      message: "These cards could not be saved. No save was confirmed.",
    };
  revalidatePath("/study");
  revalidatePath("/study/" + deck_id);
  redirect("/study/" + deck_id);
}
