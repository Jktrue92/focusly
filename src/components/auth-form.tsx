import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { authenticate } from "@/app/actions";
import { isConfigured } from "@/lib/supabase/server";
export function AuthForm({
  signup,
  message,
}: {
  signup?: boolean;
  message?: string;
}) {
  return (
    <main className="auth-page">
      <div className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">A LITTLE SPACE TO FOCUS</span>
          <h1>
            Less stress.
            <br />
            <span>More progress.</span>
          </h1>
          <p>
            Your classes, your deadlines, your fresh start.
            <br />
            Let’s take it one day at a time.
          </p>
        </div>
        <small>Built for student life. Designed for you.</small>
      </div>
      <section className="auth-panel">
        <Link className="back-link" href="/">
          ← Back to Focusly
        </Link>
        <div className="auth-card">
          <span className="eyebrow">YOUR WORKSPACE AWAITS</span>
          <h2>{signup ? "Make room for progress." : "Welcome back."}</h2>
          <p>
            {signup
              ? "Create your account and find your focus."
              : "A little focus goes a long way."}
          </p>
          {!isConfigured() && (
            <div className="notice">
              Supabase isn’t connected yet. Follow the README to configure
              authentication and the database.
            </div>
          )}
          {message && (
            <div className="notice" role="status">
              {message}
            </div>
          )}
          <form action={authenticate}>
            <input
              type="hidden"
              name="mode"
              value={signup ? "signup" : "login"}
            />
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@university.edu"
                required
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={128}
                required
                autoComplete={signup ? "new-password" : "current-password"}
              />
            </label>
            <button className="button" disabled={!isConfigured()}>
              {signup ? "Create account" : "Log in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {signup ? "Already have an account?" : "New to Focusly?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Log in" : "Create an account"}
            </Link>
          </p>
          <div className="privacy-note">
            <ShieldCheck size={15} /> Just your email. Your workspace stays
            private.
          </div>
        </div>
      </section>
    </main>
  );
}
