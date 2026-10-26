"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";
function field(form: FormData, name: string, max: number, optional = false) {
  const value = String(form.get(name) ?? "").trim();
  if ((!value && !optional) || value.length > max)
    throw new Error("Check the " + name + " field.");
  return value;
}
function identifier(value: unknown) {
  const id = String(value ?? "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new Error("Invalid study item.");
  return id;
}
function refresh(deck: string) {
  revalidatePath("/study");
  revalidatePath("/study/" + deck);
}
export async function saveDeck(form: FormData) {
  const { supabase, user } = await requireUser();
  const title = field(form, "title", 120);
  const description = field(form, "description", 500, true);
  const color = field(form, "color", 7);
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Choose a valid color.");
  const existing = form.get("id");
  const result = existing
    ? await supabase
        .from("study_decks")
        .update({ title, description, color })
        .eq("id", identifier(existing))
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("study_decks")
        .insert({ title, description, color, user_id: user.id })
        .select("id")
        .single();
  if (result.error || !result.data)
    throw new Error("The study set could not be saved. Please try again.");
  refresh(result.data.id);
  redirect("/study/" + result.data.id);
}
export async function deleteDeck(form: FormData) {
  const id = identifier(form.get("deck_id"));
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_decks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error || !data) throw new Error("The study set could not be deleted.");
  revalidatePath("/study");
  redirect("/study");
}
export async function saveCard(form: FormData) {
  const deck_id = identifier(form.get("deck_id"));
  const { supabase, user } = await requireUser();
  const term = field(form, "term", 300);
  const definition = field(form, "definition", 2000);
  const { data: deck, error: deckError } = await supabase
    .from("study_decks")
    .select("id")
    .eq("id", deck_id)
    .eq("user_id", user.id)
    .single();
  if (deckError || !deck) throw new Error("This set is unavailable.");
  const card = form.get("card_id");
  if (!card) {
    const { count, error } = await supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("deck_id", deck_id)
      .eq("user_id", user.id);
    if (error || count === null || count >= 200)
      throw new Error("Use another set. Each set supports up to 200 cards.");
  }
  const result = card
    ? await supabase
        .from("flashcards")
        .update({ term, definition })
        .eq("id", identifier(card))
        .eq("deck_id", deck_id)
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("flashcards")
        .insert({ deck_id, user_id: user.id, term, definition })
        .select("id")
        .single();
  if (result.error || !result.data)
    throw new Error("The card could not be saved.");
  if (card) {
    const { error } = await supabase
      .from("flashcard_progress")
      .delete()
      .eq("card_id", identifier(card))
      .eq("user_id", user.id);
    if (error)
      throw new Error(
        "The card was saved, but review progress could not be reset.",
      );
  }
  refresh(deck_id);
  redirect("/study/" + deck_id);
}
export async function deleteCard(form: FormData) {
  const deck = identifier(form.get("deck_id"));
  const id = identifier(form.get("card_id"));
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", id)
    .eq("deck_id", deck)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error || !data) throw new Error("This card could not be deleted.");
  refresh(deck);
}
export async function recordReview(
  cardId: string,
  correct: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const id = identifier(cardId);
  if (typeof correct !== "boolean")
    return { ok: false, message: "Choose a review result." };
  const { supabase, user } = await requireUser();
  const { data: card, error } = await supabase
    .from("flashcards")
    .select("deck_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !card)
    return {
      ok: false,
      message: "This card is no longer available. Return to your study set.",
    };
  const result = await supabase.rpc("record_card_review", {
    target_card: id,
    was_correct: correct,
  });
  if (result.error)
    return {
      ok: false,
      message: "Your result was not saved. Please try again.",
    };
  refresh(card.deck_id);
  return { ok: true };
}
