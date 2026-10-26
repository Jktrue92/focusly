type AuthFailure = { code?: string; status?: number; name?: string };

// Only show reviewed messages, never provider error bodies or account details.
export function authErrorMessage(error: AuthFailure, mode: "signup" | "login") {
  if (
    error.status === 429 ||
    ["over_email_send_rate_limit", "over_request_rate_limit"].includes(
      error.code ?? "",
    )
  ) {
    return "Too many attempts or confirmation emails. Wait a while before trying again, and check your inbox and spam folder.";
  }
  switch (error.code) {
    case "email_address_invalid":
      return "Enter a valid email address that can receive confirmation emails.";
    case "weak_password":
      return "Choose a stronger password that meets the project’s password requirements.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Email account creation is currently disabled. Please contact support.";
    case "email_address_not_authorized":
      return "Confirmation email delivery is restricted. The app owner must configure an email provider in Supabase.";
    case "email_not_confirmed":
      return "Confirm your email using the link in your inbox, then log in.";
    case "user_already_exists":
    case "email_exists":
    case "invalid_credentials":
      return "Unable to sign in or create this account. Check your details and email confirmation, or try logging in.";
    case "unexpected_failure":
      return "The authentication service could not complete this request. Please try again later.";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "Unable to reach the authentication service. Please try again shortly.";
  }
  if (mode === "signup" && (error.status === 401 || error.status === 403)) {
    return "The authentication configuration is preventing signup. The app owner should check the Supabase URL and public key in Vercel.";
  }
  return mode === "login"
    ? "Sign in failed. Check your credentials and email confirmation."
    : "Unable to create account. Please try again later or log in if you have already signed up.";
}
