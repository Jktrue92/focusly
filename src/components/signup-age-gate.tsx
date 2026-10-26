"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
const storageKey = "focusly-age-blocked";
function blocked() {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("focusly-age-choice", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("focusly-age-choice", callback);
  };
}
export function SignupAgeGate({ children }: { children: React.ReactNode }) {
  const previousBlock = useSyncExternalStore(subscribe, blocked, () => false);
  const [choice, setChoice] = useState<"unknown" | "eligible" | "blocked">(
    "unknown",
  );
  if (previousBlock || choice === "blocked")
    return (
      <section className="age-gate" aria-live="polite">
        <h3>Account creation isn’t available.</h3>
        <p>
          Focusly is for people aged 13 and older. We won’t ask for your email
          or create an account.
        </p>
        <Link href="/privacy#children">Read about children’s privacy</Link>
      </section>
    );
  if (choice === "eligible") return children;
  function choose(under13: boolean) {
    if (under13) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* Still block this page if browser storage is unavailable. */
      }
      setChoice("blocked");
      window.dispatchEvent(new Event("focusly-age-choice"));
    } else setChoice("eligible");
  }
  return (
    <section className="age-gate">
      <h3>Before we begin</h3>
      <p>Select your age group. We don’t need your date of birth.</p>
      <div className="age-options">
        <button
          type="button"
          className="secondary-button"
          onClick={() => choose(true)}
        >
          Under 13
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => choose(false)}
        >
          13 or older
        </button>
      </div>
      <Link href="/privacy#children">Why we ask</Link>
    </section>
  );
}
