"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
function text(form: FormData, key: string, max = 120) {
  const value = String(form.get(key) ?? "").trim();
  if (!value || value.length > max) throw new Error(`Invalid ${key}.`);
  return value;
}
function id(form: FormData, key = "id") {
  const value = text(form, key);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid identifier.");
  return value;
}
function refresh() {
  ["/dashboard", "/classes", "/assignments"].forEach((p) => revalidatePath(p));
}
function check(error: { message: string } | null) {
  if (error) throw new Error("Unable to save this change. Please try again.");
}
export async function authenticate(form: FormData) {
  const mode = form.get("mode") === "signup" ? "signup" : "login";
  if (!isConfigured())
    redirect(
      `/${mode}?message=Configure+Supabase+environment+variables+first.`,
    );
  const email = text(form, "email", 254);
  const password = String(form.get("password") ?? "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 128
  )
    redirect(
      `/${mode}?message=Enter+a+valid+email+and+a+password+of+8+to+128+characters.`,
    );
  const supabase = await createClient();
  const { data, error } =
    mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
  if (error)
    redirect(
      `/${mode}?message=${encodeURIComponent(mode === "login" ? "Sign in failed. Check your credentials and email confirmation." : "Unable to create account. Try again or sign in.")}`,
    );
  if (!data.session)
    redirect(
      "/login?message=Check+your+email+to+confirm+your+account,+then+sign+in.",
    );
  redirect("/dashboard");
}
export async function logout() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/");
}
export async function saveClass(form: FormData) {
  const { supabase, user } = await requireUser();
  const name = text(form, "name", 80);
  const color = text(form, "color");
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Choose a valid color.");
  const existing = form.get("id");
  const result = existing
    ? await supabase
        .from("classes")
        .update({ name, color })
        .eq("id", id(form))
        .eq("user_id", user.id)
    : await supabase.from("classes").insert({ name, color, user_id: user.id });
  check(result.error);
  refresh();
}
export async function deleteClass(form: FormData) {
  const { supabase, user } = await requireUser();
  check(
    (
      await supabase
        .from("classes")
        .delete()
        .eq("id", id(form))
        .eq("user_id", user.id)
    ).error,
  );
  refresh();
}
export async function saveAssignment(form: FormData) {
  const { supabase, user } = await requireUser();
  const title = text(form, "title", 160);
  const due_date = text(form, "due_date");
  const priority = text(form, "priority");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
    !Number.isFinite(Date.parse(due_date)) ||
    new Date(due_date).toISOString().slice(0, 10) !== due_date ||
    !["low", "medium", "high"].includes(priority)
  )
    throw new Error("Choose a valid date and priority.");
  const class_id = form.get("class_id") ? id(form, "class_id") : null;
  if (class_id) {
    const { data, error } = await supabase
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) throw new Error("Choose one of your classes.");
  }
  const values = { title, due_date, priority, class_id };
  const result = form.get("id")
    ? await supabase
        .from("assignments")
        .update(values)
        .eq("id", id(form))
        .eq("user_id", user.id)
    : await supabase
        .from("assignments")
        .insert({ ...values, user_id: user.id });
  check(result.error);
  refresh();
}
export async function deleteAssignment(form: FormData) {
  const { supabase, user } = await requireUser();
  check(
    (
      await supabase
        .from("assignments")
        .delete()
        .eq("id", id(form))
        .eq("user_id", user.id)
    ).error,
  );
  refresh();
}
export async function toggleAssignment(form: FormData) {
  const { supabase, user } = await requireUser();
  check(
    (
      await supabase
        .from("assignments")
        .update({ completed: form.get("completed") === "true" })
        .eq("id", id(form))
        .eq("user_id", user.id)
    ).error,
  );
  refresh();
}
export async function updatePassword(form: FormData) {
  const { supabase } = await requireUser();
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 128)
    redirect("/settings?message=Use+8+to+128+characters.");
  const { error } = await supabase.auth.updateUser({ password });
  redirect(
    "/settings?message=" +
      encodeURIComponent(
        error
          ? "Password update failed. Please sign in again and retry."
          : "Password updated.",
      ),
  );
}
