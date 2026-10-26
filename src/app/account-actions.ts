"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";
export async function deleteAccount(form: FormData) {
  if (form.get("confirmation") !== "DELETE")
    redirect("/settings?message=Type+DELETE+to+confirm+account+deletion.");
  const password = String(form.get("current_password") ?? "");
  if (password.length < 8 || password.length > 128)
    redirect(
      "/settings?message=Enter+your+current+password+to+delete+your+account.",
    );
  const { supabase, user } = await requireUser();
  if (!user.email)
    redirect(
      "/settings?message=Contact+the+privacy+team+for+account+deletion.",
    );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error || data.user?.id !== user.id)
    redirect(
      "/settings?message=Unable+to+verify+your+password.+No+data+was+deleted.",
    );
  const { error: deletionError } = await supabase.rpc("delete_own_account");
  if (deletionError) {
    console.error("Focusly account deletion failed", {
      code: deletionError.code,
    });
    redirect(
      "/settings?message=Account+deletion+is+unavailable.+Please+contact+hellofocusly%40gmail.com.+No+deletion+was+confirmed.",
    );
  }
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?message=Your+account+and+workspace+have+been+deleted.");
}
