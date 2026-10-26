import { SubmitButton } from "./submit-button";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Brand } from "./brand";
import {
  finishPasswordReset,
  requestPasswordReset,
} from "@/app/recovery-actions";
export function RecoveryForm({
  reset = false,
  message,
  sent = false,
}: {
  reset?: boolean;
  message?: string;
  sent?: boolean;
}) {
  return (
    <main className="recovery-page">
      <Brand />
      <section className="recovery-card">
        <span className="recovery-icon">
          <KeyRound size={25} />
        </span>
        <span className="eyebrow">A FRESH START</span>
        <h1>
          {reset
            ? "Choose a new password."
            : sent
              ? "Check your inbox."
              : "Forgot your password?"}
        </h1>
        <p>
          {reset
            ? "Make it strong, make it yours."
            : sent
              ? "If an account exists for that address, a reset link will be sent. Check spam too. Open it in this browser."
              : "It happens. We’ll send a link to help you get back to your workspace."}
        </p>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        {!sent && (
          <form action={reset ? finishPasswordReset : requestPasswordReset}>
            {reset ? (
              <>
                <label>
                  New password
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
              </>
            ) : (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  maxLength={254}
                  required
                />
              </label>
            )}
            <SubmitButton
              pendingLabel={reset ? "Updating password…" : "Sending link…"}
            >
              {reset ? "Save new password" : "Send reset link"}
            </SubmitButton>
          </form>
        )}
        <Link href="/login" className="back-to-login">
          ← Back to log in
        </Link>
      </section>
      <Link className="auth-policy-link" href="/privacy">
        Privacy Policy
      </Link>
    </main>
  );
}
