import { workspaceData } from "@/lib/data";
import { normalizeFilters } from "@/lib/assignment-filters";
import { AssignmentWorkspace } from "@/components/assignment-workspace";
export default async function Assignments({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classes, assignments } = await workspaceData();
  const filters = normalizeFilters(await searchParams);
  return (
    <AssignmentWorkspace
      classes={classes}
      assignments={assignments}
      filters={filters}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
