export const maxDuration = 90;
import { studyLibrary } from "@/lib/study-data";
import {
  aiConfigured,
  aiSetupMessage,
  aiProvider,
  aiProviderLabel,
} from "@/lib/study-ai";
import { StudyAgent } from "@/components/study-agent";
import { StudyUnavailable } from "@/components/study-library";
export default async function Agent() {
  const { available, decks } = await studyLibrary();
  return available ? (
    <StudyAgent
      decks={decks}
      enabled={aiConfigured()}
      configurationHint={aiSetupMessage()}
      providerLabel={aiProviderLabel()}
      providerId={aiProvider() ?? "openai"}
    />
  ) : (
    <StudyUnavailable />
  );
}
