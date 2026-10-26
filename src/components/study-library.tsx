import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Layers,
  Plus,
  Sparkles,
} from "lucide-react";
import { ActionButton } from "./action-button";
import { saveDeck } from "@/app/study-actions";
import type { StudyDeck, Flashcard, StudyProgress } from "@/lib/study";
export function StudyUnavailable() {
  return (
    <section className="panel polished-empty">
      <span>
        <Layers size={27} />
      </span>
      <h2>Your study space is being prepared.</h2>
      <p>
        Study tools aren’t available yet. Please try again shortly. Your classes
        and assignments are still available.
      </p>
      <Link href="/dashboard" className="text-link">
        Back to overview <ArrowRight size={14} />
      </Link>
    </section>
  );
}
export function DeckForm({ deck }: { deck?: StudyDeck }) {
  return (
    <form action={saveDeck} className="editor-form">
      {deck && <input type="hidden" name="id" value={deck.id} />}
      <label>
        Set title
        <input
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Biology · Cell structure"
          defaultValue={deck?.title}
        />
      </label>
      <label>
        Description <span className="field-optional">optional</span>
        <textarea
          name="description"
          maxLength={500}
          rows={2}
          placeholder="What are you learning?"
          defaultValue={deck?.description}
        />
      </label>
      <div className="deck-form-footer">
        <label>
          Color
          <input
            name="color"
            type="color"
            defaultValue={deck?.color ?? "#7065f0"}
          />
        </label>
        <ActionButton>{deck ? "Save set" : "Create study set"}</ActionButton>
      </div>
    </form>
  );
}
export function StudyLibrary({
  decks,
  cards,
  progress,
  available,
}: {
  decks: StudyDeck[];
  cards: Pick<Flashcard, "id" | "deck_id">[];
  progress: StudyProgress[];
  available: boolean;
}) {
  const known = new Set(progress.filter((p) => p.known).map((p) => p.card_id));
  return (
    <div className="management-page study-library">
      <header className="management-heading">
        <div>
          <span className="eyebrow">LESS REREADING. MORE REMEMBERING.</span>
          <h1>
            Your study space<span>.</span>
          </h1>
          <p>Make a set. Test yourself. Find out what sticks.</p>
        </div>
        <span className="management-emblem">
          <Layers size={28} />
        </span>
      </header>
      {!available ? (
        <StudyUnavailable />
      ) : (
        <>
          <div className="management-summary">
            <span>
              <i />
              {decks.length} study sets
            </span>
            <span>{cards.length} flashcards</span>
            <span>{known.size} learned</span>
          </div>
          <Link href="/study/agent" className="study-agent-banner">
            <span className="study-agent-icon">
              <Sparkles size={22} />
            </span>
            <div>
              <strong>
                A little help from your AI study coach <span>OPT-IN BETA</span>
              </strong>
              <p>
                Turn notes you choose to share into a summary and flashcard
                drafts. Review before saving.
              </p>
            </div>
            <ArrowUpRight size={21} />
          </Link>
          <details className="panel composer" open={!decks.length}>
            <summary>
              <span className="composer-icon">
                <Plus size={18} />
              </span>
              <div>
                <strong>Create a study set</strong>
                <small>A small collection for a big idea.</small>
              </div>
              <Plus size={17} className="composer-expand" />
            </summary>
            <DeckForm />
          </details>
          <div className="study-deck-grid">
            {decks.map((deck) => {
              const items = cards.filter((c) => c.deck_id === deck.id);
              const learned = items.filter((c) => known.has(c.id)).length;
              return (
                <Link
                  href={"/study/" + deck.id}
                  key={deck.id}
                  className="study-deck-card"
                  style={{ borderTopColor: deck.color }}
                >
                  <div className="course-card-top">
                    <span
                      className="course-icon"
                      style={{
                        color: deck.color,
                        background: deck.color + "18",
                      }}
                    >
                      <Layers size={22} />
                    </span>
                    <ArrowUpRight size={17} />
                  </div>
                  <h2>{deck.title}</h2>
                  <p>
                    {deck.description ||
                      "Your next small step toward knowing it."}
                  </p>
                  <div className="study-deck-meta">
                    <span>{items.length} cards</span>
                    <span>{learned} learned</span>
                  </div>
                  <div className="course-progress-track">
                    <span
                      style={{
                        width:
                          (items.length ? (learned / items.length) * 100 : 0) +
                          "%",
                        background: deck.color,
                      }}
                    />
                  </div>
                  <span className="study-deck-link">
                    Open study set <ArrowRight size={13} />
                  </span>
                </Link>
              );
            })}
          </div>
          {!decks.length && (
            <div className="panel polished-empty">
              <span>
                <Brain size={27} />
              </span>
              <h2>Good ideas deserve to stick.</h2>
              <p>
                Create your first set above. Add your own terms and answers,
                then practice with flashcards, written recall, or a quiz.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
