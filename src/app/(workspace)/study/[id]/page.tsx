import { studyDeck } from "@/lib/study-data";
import { DeckEditor } from "@/components/deck-editor";
import { StudyUnavailable } from "@/components/study-library";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { deck, cards, progress, available } = await studyDeck(id);
  return !available || !deck ? (
    <StudyUnavailable />
  ) : (
    <DeckEditor deck={deck} cards={cards} progress={progress} />
  );
}
