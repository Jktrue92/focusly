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
  const { supabase } = await requireUser();
  const [classes, assignments] = await Promise.all([
    supabase.from("classes").select("id,name,color").order("name"),
    supabase
      .from("assignments")
      .select("id,title,class_id,due_date,priority,completed")
      .order("due_date"),
  ]);
  if (classes.error || assignments.error)
    throw new Error(
      "Unable to load your workspace. Check the Supabase connection and apply the database migration.",
    );
  return {
    classes: classes.data as ClassRecord[],
    assignments: assignments.data as Assignment[],
  };
}
