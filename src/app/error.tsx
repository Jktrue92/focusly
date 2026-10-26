"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Let’s try that again.</h1>
      <p>
        We couldn’t complete this request. Check your connection and Supabase
        setup, then retry.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
