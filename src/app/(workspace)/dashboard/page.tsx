import { workspaceData } from "@/lib/data";
import { DashboardView } from "@/components/dashboard-view";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { classes, assignments } = await workspaceData();
  const requested = (await searchParams).date;
  const valid =
    requested &&
    /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
    Number.isFinite(Date.parse(requested)) &&
    new Date(requested).toISOString().slice(0, 10) === requested;
  const today = valid ? requested : new Date().toISOString().slice(0, 10);
  return (
    <DashboardView classes={classes} assignments={assignments} today={today} />
  );
}
