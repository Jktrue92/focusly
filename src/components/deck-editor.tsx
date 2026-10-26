import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers, Plus, Trash2 } from "lucide-react";
import { ActionButton } from "./action-button";
import { DeckForm } from "./study-library";
import { deleteDeck, deleteCard, saveCard } from "@/app/study-actions";
import type { StudyDeck, Flashcard, StudyProgress } from "@/lib/study";
export function CardForm({
  deckId,
  card,
}: {
  deckId: string;
  card?: Flashcard;
}) {
  return (
    <form action={saveCard} className="editor-form">
      <input type="hidden" name="deck_id" value={deckId} />
      {card && <input type="hidden" name="card_id" value={card.id} />}
      <label>
        Term or question
        <textarea
          name="term"
          required
          maxLength={300}
          rows={2}
          placeholder="e.g. What is the function of mitochondria?"
          defaultValue={card?.term}
        />
      </label>
      <label>
        Definition or answer
        <textarea
          name="definition"
          required
          maxLength={2000}
          rows={3}
          placeholder="Explain it in your own words…"
          defaultValue={card?.definition}
        />
      </label>
      <ActionButton>{card ? "Save card" : "Add flashcard"}</ActionButton>
    </form>
  );
}
export function DeckEditor({
  deck,
  cards,
  progress,
}: {
  deck: StudyDeck;
  cards: Flashcard[];
  progress: StudyProgress[];
}) {
  const known = new Set(progress.filter((p) => p.known).map((p) => p.card_id));
  const learned = cards.filter((c) => known.has(c.id)).length;
  return (
    <div className="management-page deck-editor">
      <Link href="/study" className="study-back">
        <ArrowLeft size={14} /> All study sets
      </Link>
      <header className="management-heading">
        <div>
          <span className="eyebrow">A LITTLE PRACTICE GOES A LONG WAY</span>
          <h1>
            {deck.title}
            <span>.</span>
          </h1>
          <p>
            {deck.description || "Your personal collection. Your own pace."}
          </p>
        </div>
        <span className="management-emblem" style={{ color: deck.color }}>
          <Layers size={28} />
        </span>
      </header>
      <div className="management-summary">
        <span>
          <i />
          {cards.length} cards
        </span>
        <span>{learned} learned</span>
        <span>{cards.length - learned} still learning</span>
      </div>
      <div className="deck-practice-actions">
        {cards.length > 0 ? (
          <>
            <Link href={"/study/" + deck.id + "/practice"} className="button">
              Start studying <ArrowRight size={16} />
            </Link>
            {learned < cards.length && (
              <Link
                href={"/study/" + deck.id + "/practice?focus=unlearned"}
                className="secondary-button"
              >
                Review unlearned
              </Link>
            )}
          </>
        ) : (
          <p>Add your first flashcard below to unlock practice.</p>
        )}
      </div>
      <details className="panel composer" open={!cards.length}>
        <summary>
          <span className="composer-icon">
            <Plus size={18} />
          </span>
          <div>
            <strong>Add a flashcard</strong>
            <small>One clear question. One helpful answer.</small>
          </div>
          <Plus size={17} className="composer-expand" />
        </summary>
        <CardForm deckId={deck.id} />
      </details>
      <section className="panel deck-cards">
        <div className="section-heading">
          <h2>Cards in this set</h2>
          <span className="pill">{cards.length} / 200</span>
        </div>
        {cards.length ? (
          cards.map((card, index) => (
            <article key={card.id} className="deck-card-row">
              <span className="card-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="deck-card-content">
                <div className="deck-card-columns">
                  <div>
                    <span className="card-eyebrow">TERM / QUESTION</span>
                    <h3>{card.term}</h3>
                  </div>
                  <div>
                    <span className="card-eyebrow">DEFINITION / ANSWER</span>
                    <p>{card.definition}</p>
                  </div>
                </div>
                {card.source_excerpt && (
                  <details className="source-note">
                    <summary>Source excerpt</summary>
                    <blockquote>{card.source_excerpt}</blockquote>
                  </details>
                )}
                <div className="deck-card-controls">
                  <span
                    className={
                      known.has(card.id) ? "learned-badge" : "learning-badge"
                    }
                  >
                    {known.has(card.id) ? "Learned" : "Still learning"}
                  </span>
                  <details>
                    <summary>Edit card</summary>
                    <p className="tiny muted">
                      Editing a card resets its review progress.
                    </p>
                    <CardForm deckId={deck.id} card={card} />
                  </details>
                  <details className="delete-details">
                    <summary>
                      <Trash2 size={12} /> Delete card
                    </summary>
                    <form action={deleteCard}>
                      <input name="deck_id" type="hidden" value={deck.id} />
                      <input name="card_id" type="hidden" value={card.id} />
                      <ActionButton
                        className="danger-button"
                        pendingLabel="Deleting…"
                      >
                        Confirm deletion
                      </ActionButton>
                    </form>
                  </details>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="polished-empty">
            <span>
              <Layers size={25} />
            </span>
            <h2>Make something worth remembering.</h2>
            <p>
              Add a term and an answer above. Your cards stay private to your
              account.
            </p>
          </div>
        )}
      </section>
      <details className="panel deck-settings">
        <summary>Study set settings</summary>
        <DeckForm deck={deck} />
        <details className="delete-details">
          <summary>Delete this study set</summary>
          <p className="tiny muted">
            This permanently deletes the set, its cards, and their study
            progress.
          </p>
          <form action={deleteDeck}>
            <input name="deck_id" type="hidden" value={deck.id} />
            <ActionButton className="danger-button" pendingLabel="Deleting…">
              Delete set and cards
            </ActionButton>
          </form>
        </details>
      </details>
    </div>
  );
}
