"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";
export async function requestPasswordReset(form: FormData) {
  if (!isConfigured())
    redirect(
      "/forgot-password?message=Password+recovery+is+not+configured+yet.",
    );
  const email = String(form.get("email") ?? "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/forgot-password?message=Enter+a+valid+email+address.");
  const requestHeaders = await headers();
  const rawOrigin =
    process.env.NEXT_PUBLIC_SITE_URL || requestHeaders.get("origin");
  let origin: string;
  try {
    const parsed = new URL(rawOrigin ?? "");
    if (
      parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname)
      )
    )
      throw new Error();
    origin = parsed.origin;
  } catch {
    redirect(
      "/forgot-password?message=Password+recovery+is+temporarily+unavailable.",
    );
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin + "/auth/callback?next=/reset-password",
  });
  if (error) {
    console.error("Focusly recovery failed", {
      code: error.code ?? "unknown",
      status: error.status,
    });
    if (error.status === 429)
      redirect(
        "/forgot-password?message=Too+many+requests.+Wait+before+trying+again.+Check+your+inbox+for+an+existing+reset+link.",
      );
    redirect(
      "/forgot-password?message=If+an+account+exists,+you+may+receive+a+reset+email.+Delivery+is+not+guaranteed;+please+try+again+later+if+none+arrives.",
    );
  }
  redirect("/forgot-password?sent=1");
}
export async function finishPasswordReset(form: FormData) {
  if (!isConfigured()) redirect("/forgot-password");
  const password = String(form.get("password") ?? "");
  if (
    password.length < 8 ||
    password.length > 128 ||
    password !== form.get("confirm_password")
  )
    redirect(
      "/reset-password?message=Use+8+to+128+characters+and+make+sure+both+passwords+match.",
    );
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    redirect(
      "/forgot-password?message=Your+reset+link+has+expired.+Request+a+new+one.",
    );
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    redirect(
      "/reset-password?message=Unable+to+update+your+password.+Use+a+stronger,+different+password+or+request+a+new+link.",
    );
  await supabase.auth.signOut();
  redirect("/login?message=Password+updated.+Log+in+with+your+new+password.");
}
