"use client";
import { AI_CONSENT_VERSION, type AIProvider } from "@/lib/ai-contract";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { generateStudyDraft, saveStudyDraft } from "@/app/study-ai-actions";
import { ActionButton } from "./action-button";
import type { StudyDeck } from "@/lib/study";
import type { StudyDraft } from "@/lib/study-ai";
import type { AIStudyState } from "@/lib/study-ai";
const initial: AIStudyState = { message: "" };
export function StudyAgent({
  decks,
  enabled,
  configurationHint,
  providerLabel = "OpenAI",
  providerId = "openai",
}: {
  decks: StudyDeck[];
  enabled: boolean;
  configurationHint?: string;
  providerLabel?: string;
  providerId?: AIProvider;
}) {
  const [notes, setNotes] = useState("");
  const [state, action, pending] = useActionState(generateStudyDraft, initial);
  return (
    <div className="management-page study-agent">
      <Link href="/study" className="study-back">
        <ArrowLeft size={14} /> Back to study space
      </Link>
      <header className="management-heading">
        <div>
          <span className="eyebrow">A HELPING HAND, NOT AN AUTOPILOT</span>
          <h1>
            Your AI study coach<span>.</span>
          </h1>
          <p>
            Your notes in. A clearer starting point out. You stay in control.
          </p>
        </div>
        <span className="management-emblem">
          <Sparkles size={28} />
        </span>
      </header>
      <section className="ai-privacy-callout">
        <ShieldCheck size={21} />
        <div>
          <strong>Optional. Private to your workflow. Always review.</strong>
          <p>
            Only the notes you submit here go to {providerLabel}—not your
            account email, classes, or other sets. Daylane does not save the
            submitted notes.
            {providerLabel} may process or retain them under its API policies.
            Do not include names, student IDs, contact details, health
            information, or other sensitive information. AI can make mistakes.
          </p>
          <Link href="/privacy">
            Read the Privacy Policy <ArrowRight size={12} />
          </Link>
        </div>
      </section>
      {providerId === "cloudflare" && (
        <p className="provider-free-note">
          Cloudflare’s free tier has a shared daily allocation. Requests may
          stop once it is used; there is no automatic fallback to a paid
          provider.
        </p>
      )}
      {!enabled && (
        <div className="notice" role="status">
          {configurationHint ||
            "The AI beta is not enabled on this deployment yet."}{" "}
          No notes will be sent. You can still create and practice with your own
          flashcards.
        </div>
      )}
      <section className="panel">
        <form action={action} className="editor-form ai-notes-form">
          <input type="hidden" name="ai_provider" value={providerId} />
          <input
            type="hidden"
            name="ai_consent_version"
            value={AI_CONSENT_VERSION}
          />
          <label>
            Your study notes
            <textarea
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={9}
              required
              minLength={100}
              maxLength={12000}
              placeholder="Paste your own non-sensitive study notes here. At least 100 characters gives the coach enough context."
              disabled={!enabled || pending}
            />
          </label>
          <label>
            Draft size
            <select
              name="count"
              defaultValue="5"
              disabled={!enabled || pending}
            >
              <option value="5">Up to 5 cards</option>
              <option value="10">Up to 10 cards</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ai_consent"
              required
              disabled={!enabled || pending}
            />
            <span>
              I am 13 or older and choose to send these notes to {providerLabel}{" "}
              to generate this draft. I understand that I must check the output.
            </span>
          </label>
          <button
            className="button"
            disabled={!enabled || pending}
            aria-busy={pending}
          >
            <Sparkles size={16} />
            {pending ? "Preparing your draft…" : "Draft summary & flashcards"}
          </button>
          <p className="session-hint">
            Beta limits: 1 attempt per minute, 5 per hour, and 20 per UTC day.
            Failed provider requests count toward the limit. No browsing or
            autonomous account changes.
          </p>
        </form>
      </section>
      {state.message && (
        <p className="notice" role="status">
          {state.message}
        </p>
      )}
      {state.draft && (
        <StudyDraftReview
          key={JSON.stringify(state.draft)}
          draft={state.draft}
          decks={decks}
        />
      )}
    </div>
  );
}

export function StudyDraftReview({
  draft,
  decks,
}: {
  draft: StudyDraft;
  decks: StudyDeck[];
}) {
  const [saveState, saveAction] = useActionState(saveStudyDraft, {
    message: "",
  });
  return (
    <section className="panel ai-draft">
      <span className="eyebrow">YOUR REVIEW COMES FIRST</span>
      <h2>A starting point for your study session.</h2>
      <p className="ai-summary">{draft.summary}</p>
      <p className="session-hint">
        Source excerpts are checked against your submitted notes. That check
        does not guarantee the generated answer is correct. Edit anything that
        needs work.
      </p>
      <form action={saveAction} className="editor-form">
        <input type="hidden" name="card_count" value={draft.cards.length} />
        {draft.cards.map((card, i) => (
          <article key={i} className="ai-draft-card">
            <label className="checkbox-label">
              <input
                name={"include_card_" + i}
                type="checkbox"
                defaultChecked
              />
              <span>Include card {i + 1}</span>
            </label>
            <label>
              Term or question
              <textarea
                name={"term_" + i}
                defaultValue={card.term}
                required
                maxLength={300}
                rows={2}
              />
            </label>
            <label>
              Definition or answer
              <textarea
                name={"definition_" + i}
                defaultValue={card.definition}
                required
                maxLength={2000}
                rows={3}
              />
            </label>
            <details className="source-note">
              <summary>Check source excerpt</summary>
              <blockquote>{card.source_excerpt}</blockquote>
            </details>
            <input
              type="hidden"
              name={"source_" + i}
              value={card.source_excerpt}
            />
          </article>
        ))}
        {decks.length ? (
          <>
            <label>
              Save reviewed cards to
              <select name="deck_id" required defaultValue={decks[0].id}>
                {decks.map((deck) => (
                  <option value={deck.id} key={deck.id}>
                    {deck.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input name="review_confirmed" type="checkbox" required />
              <span>
                I have reviewed the selected cards and want to save them.
              </span>
            </label>
            {saveState.message && (
              <p className="notice" role="alert">
                {saveState.message}
              </p>
            )}
            <ActionButton pendingLabel="Saving cards…">
              Save reviewed cards <ArrowRight size={15} />
            </ActionButton>
          </>
        ) : (
          <p className="notice">
            <Link href="/study">Create a study set</Link> before saving cards.
            Your draft is not stored and will be lost if you leave this page.
          </p>
        )}
      </form>
    </section>
  );
}
