import type { ClassMeeting } from "./schedule";
import { redirect } from "next/navigation";
import { createClient, isConfigured } from "./supabase/server";
export async function requireUser() {
  if (!isConfigured())
    redirect("/login?message=Configure+Supabase+to+enable+your+workspace.");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}
export type ClassRecord = { id: string; name: string; color: string };
export type Assignment = {
  id: string;
  title: string;
  class_id: string | null;
  due_date: string;
  priority: string;
  completed: boolean;
};
export async function workspaceData() {
  const { supabase, user } = await requireUser();
  const [classes, assignments, meetings] = await Promise.all([
    supabase.from("classes").select("id,name,color").order("name"),
    supabase
      .from("assignments")
      .select("id,title,class_id,due_date,priority,completed")
      .order("due_date"),
    supabase
      .from("class_meetings")
      .select(
        "id,class_id,weekday,start_time,end_time,term_start,term_end,timezone",
      )
      .eq("user_id", user.id)
      .order("weekday")
      .order("start_time"),
  ]);
  if (classes.error || assignments.error)
    throw new Error(
      "Unable to load your workspace. Check the Supabase connection and apply the database migration.",
    );
  const missingSchedule =
    meetings.error?.code === "PGRST205" || meetings.error?.code === "42P01";
  if (meetings.error && !missingSchedule)
    throw new Error("Your schedule could not be loaded.");
  return {
    meetings: (meetings.data ?? []) as ClassMeeting[],
    scheduleAvailable: !missingSchedule,
    classes: classes.data as ClassRecord[],
    assignments: assignments.data as Assignment[],
  };
}
