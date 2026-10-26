import { StudyUnavailable } from "@/components/study-library";
export const maxDuration = 90;
import { workspaceData } from "@/lib/data";
import { aiConfigured, aiProvider, aiProviderLabel } from "@/lib/study-ai";
import { ScheduleImport } from "@/components/schedule-import";
export default async function Page() {
  const { classes, scheduleAvailable } = await workspaceData();
  if (!scheduleAvailable) return <StudyUnavailable />;
  return (
    <ScheduleImport
      classes={classes}
      enabled={aiConfigured()}
      providerLabel={aiProviderLabel()}
      providerId={aiProvider() ?? "openai"}
    />
  );
}
