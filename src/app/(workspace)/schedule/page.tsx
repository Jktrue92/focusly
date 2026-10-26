import { workspaceData } from "@/lib/data";
import { ScheduleView } from "@/components/schedule-view";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const { classes, meetings, scheduleAvailable } = await workspaceData();
  const { imported } = await searchParams;
  return (
    <ScheduleView
      classes={classes}
      meetings={meetings}
      available={scheduleAvailable}
      imported={imported === "1"}
    />
  );
}
