import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const recovery = request.nextUrl.searchParams.get("type") === "recovery";
  const destination =
    recovery || request.nextUrl.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/dashboard";
  if (code || (token_hash && recovery)) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: token_hash!,
          type: "recovery",
        });
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(
    new URL(
      destination === "/reset-password"
        ? "/forgot-password?message=Your+reset+link+is+invalid+or+expired.+Request+a+new+one."
        : "/login?message=Confirmation+failed.+Please+try+signing+in.",
      request.url,
    ),
  );
}
