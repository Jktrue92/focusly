import { notFound } from "next/navigation";
import { requireUser } from "./data";
import { readAll } from "./read-all";
import type { StudyDeck, Flashcard, StudyProgress } from "./study";
const missing = (code: string | undefined) =>
  code === "PGRST205" || code === "42P01";
export async function studyLibrary() {
  const { supabase, user } = await requireUser();
  const [decks, cards, progress] = await Promise.all([
    readAll<StudyDeck>((start, end) =>
      supabase
        .from("study_decks")
        .select("id,title,description,color,created_at")
        .eq("user_id", user.id)
        .order("id")
        .range(start, end),
    ),
    readAll<Pick<Flashcard, "id" | "deck_id">>((start, end) =>
      supabase
        .from("flashcards")
        .select("id,deck_id")
        .eq("user_id", user.id)
        .order("id")
        .range(start, end),
    ),
    readAll<StudyProgress>((start, end) =>
      supabase
        .from("flashcard_progress")
        .select("card_id,known,review_count,last_reviewed")
        .eq("user_id", user.id)
        .order("card_id")
        .range(start, end),
    ),
  ]);
  const errors = [decks.error, cards.error, progress.error].filter(Boolean);
  if (errors.some((e) => missing(e?.code)))
    return { available: false, decks: [], cards: [], progress: [] } as {
      available: boolean;
      decks: StudyDeck[];
      cards: Pick<Flashcard, "id" | "deck_id">[];
      progress: StudyProgress[];
    };
  if (errors.length)
    throw new Error(
      "Your study library could not be loaded. Try a smaller library or contact support.",
    );
  return {
    available: true,
    decks: (decks.data ?? []).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    cards: cards.data ?? [],
    progress: progress.data ?? [],
  };
}
export async function studyDeck(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const { supabase, user } = await requireUser();
  const deck = await supabase
    .from("study_decks")
    .select("id,title,description,color,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (missing(deck.error?.code))
    return {
      available: false,
      deck: null,
      cards: [] as Flashcard[],
      progress: [] as StudyProgress[],
    };
  if (deck.error) throw new Error("This study set could not be loaded.");
  if (!deck.data) notFound();
  const cards = await supabase
    .from("flashcards")
    .select("id,deck_id,term,definition,source_excerpt,created_at")
    .eq("deck_id", id)
    .eq("user_id", user.id)
    .order("created_at")
    .limit(200);
  if (cards.error) throw new Error("These cards could not be loaded.");
  const items = cards.data as Flashcard[];
  const progress = items.length
    ? await supabase
        .from("flashcard_progress")
        .select("card_id,known,review_count,last_reviewed")
        .eq("user_id", user.id)
        .in(
          "card_id",
          items.map((c) => c.id),
        )
        .limit(200)
    : { data: [], error: null };
  if (progress.error)
    throw new Error("Your review progress could not be loaded.");
  return {
    available: true,
    deck: deck.data as StudyDeck,
    cards: items,
    progress: progress.data as StudyProgress[],
  };
}
