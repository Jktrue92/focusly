export const maxDuration = 60;
import { studyLibrary } from "@/lib/study-data";
import { aiConfigured } from "@/lib/study-ai";
import { StudyAgent } from "@/components/study-agent";
import { StudyUnavailable } from "@/components/study-library";
export default async function Agent() {
  const { available, decks } = await studyLibrary();
  return available ? (
    <StudyAgent decks={decks} enabled={aiConfigured()} />
  ) : (
    <StudyUnavailable />
  );
}
