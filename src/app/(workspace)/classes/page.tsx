import { workspaceData } from "@/lib/data";
import { ClassesWorkspace } from "@/components/classes-workspace";
export default async function Classes() {
  const { classes, assignments, meetings } = await workspaceData();
  return (
    <ClassesWorkspace
      classes={classes}
      assignments={assignments}
      meetings={meetings}
    />
  );
}
