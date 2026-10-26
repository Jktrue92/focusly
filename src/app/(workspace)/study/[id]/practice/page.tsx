import { studyDeck } from "@/lib/study-data";
import { StudySession } from "@/components/study-session";
import { StudyUnavailable } from "@/components/study-library";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const { id } = await params;
  const { deck, cards, progress, available } = await studyDeck(id);
  if (!available || !deck) return <StudyUnavailable />;
  const { focus } = await searchParams;
  const known = new Set(progress.filter((p) => p.known).map((p) => p.card_id));
  return (
    <StudySession
      deckId={id}
      title={deck.title}
      cards={
        focus === "unlearned" ? cards.filter((c) => !known.has(c.id)) : cards
      }
    />
  );
}
