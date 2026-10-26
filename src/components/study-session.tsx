"use client";
import Link from "next/link";
import { useState, useTransition, useRef, useId } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Layers,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import {
  answerMatches,
  quizAvailable,
  quizChoices,
  shuffled,
  type Flashcard,
} from "@/lib/study";
import { recordReview } from "@/app/study-actions";
type Mode = "flashcards" | "write" | "quiz";
export function StudySession({
  cards,
  deckId,
  title,
}: {
  cards: Flashcard[];
  deckId: string;
  title: string;
}) {
  const inFlight = useRef(false);
  const contentId = useId();
  const [mode, setMode] = useState<Mode>("flashcards");
  const [order, setOrder] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [options, setOptions] = useState<string[]>([]);
  const card = order[index];
  const finished = index >= order.length;
  const quizEnabled = quizAvailable(cards);
  function reset(nextMode: Mode = mode, shuffle = false) {
    const next = shuffle ? shuffled(cards) : [...cards];
    setMode(nextMode);
    setOrder(next);
    setIndex(0);
    setFlipped(false);
    setAnswer("");
    setResult(null);
    setCorrect(0);
    setError("");
    setOptions(
      nextMode === "quiz" && next[0] ? quizChoices(next[0], cards) : [],
    );
  }
  function grade(wasCorrect: boolean) {
    if (inFlight.current || pending || result !== null || !card) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        const saved = await recordReview(card.id, wasCorrect);
        if (!saved.ok) {
          setError(saved.message ?? "Your result was not saved.");
          return;
        }
        setResult(wasCorrect);
        if (wasCorrect) setCorrect((value) => value + 1);
      } catch {
        setError(
          "Your result could not be saved. Check your connection and retry.",
        );
      } finally {
        inFlight.current = false;
      }
    });
  }
  function next() {
    if (result === null || pending) return;
    const following = index + 1;
    setIndex(following);
    setFlipped(false);
    setAnswer("");
    setResult(null);
    setError("");
    setOptions(
      mode === "quiz" && order[following]
        ? quizChoices(order[following], cards)
        : [],
    );
  }
  if (!cards.length)
    return (
      <div className="panel polished-empty">
        <span>
          <CheckCheck size={27} />
        </span>
        <h2>You’re all caught up.</h2>
        <p>
          There are no cards in this review. Add cards or practice the whole
          set.
        </p>
        <Link href={"/study/" + deckId} className="text-link">
          Back to set <ArrowRight size={14} />
        </Link>
      </div>
    );
  return (
    <div className="study-session">
      <Link href={"/study/" + deckId} className="study-back">
        <ArrowLeft size={14} /> Back to set
      </Link>
      <header className="session-heading">
        <div>
          <span className="eyebrow">
            A LITTLE MORE CONFIDENT, ONE CARD AT A TIME
          </span>
          <h1>{title}</h1>
        </div>
        <button
          type="button"
          className="session-shuffle"
          onClick={() => reset(mode, true)}
          disabled={pending}
        >
          <Shuffle size={15} /> Shuffle & restart
        </button>
      </header>
      <div className="study-mode-tabs" aria-label="Practice mode">
        {(["flashcards", "write", "quiz"] as const).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => reset(value)}
            disabled={pending || (value === "quiz" && !quizEnabled)}
            aria-pressed={mode === value}
          >
            {value === "flashcards"
              ? "Flashcards"
              : value === "write"
                ? "Written recall"
                : "Multiple choice"}
          </button>
        ))}
      </div>
      {!quizEnabled && (
        <p className="session-hint">
          Multiple choice unlocks with four unique answers. Flashcards and
          written recall work with any set.
        </p>
      )}
      {finished ? (
        <section className="session-finish">
          <span>
            <Sparkles size={33} />
          </span>
          <span className="eyebrow">YOU SHOWED UP. THAT COUNTS.</span>
          <h2>Look at that progress.</h2>
          <p>
            You marked or answered{" "}
            <strong>
              {correct} of {order.length}
            </strong>{" "}
            cards correctly this session.
          </p>
          <p className="tiny muted">
            Your review results have been saved. “Learned” reflects your most
            recent answer, not a guaranteed mastery score.
          </p>
          <div>
            <button type="button" className="button" onClick={() => reset()}>
              <RotateCcw size={16} /> Practice again
            </button>
            <Link className="secondary-button" href={"/study/" + deckId}>
              Back to set
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="session-progress-label">
            <span>
              Card {index + 1} of {order.length}
            </span>
            <span>{correct} correct this session</span>
          </div>
          <div className="session-progress">
            <span style={{ width: (index / order.length) * 100 + "%" }} />
          </div>
          <section className="practice-card-shell" key={card.id + "-" + mode}>
            {mode === "flashcards" ? (
              <>
                <p id={contentId} className="sr-only" aria-live="polite">
                  Question: {card.term}
                  {flipped ? " Answer: " + card.definition : ""}
                </p>
                <button
                  type="button"
                  aria-describedby={contentId}
                  className={"flip-card " + (flipped ? "is-flipped" : "")}
                  onClick={() => setFlipped((value) => !value)}
                  aria-label={flipped ? "Show question" : "Reveal answer"}
                >
                  <span className="flip-inner">
                    <span className="flip-front" aria-hidden={flipped}>
                      <span className="card-eyebrow">TERM / QUESTION</span>
                      <strong>{card.term}</strong>
                      <small>
                        Click to reveal the answer <RotateCcw size={12} />
                      </small>
                    </span>
                    <span className="flip-back" aria-hidden={!flipped}>
                      <span className="card-eyebrow">DEFINITION / ANSWER</span>
                      <strong>{card.definition}</strong>
                      <small>Click to return to the question</small>
                    </span>
                  </span>
                </button>
                {!flipped && result === null && (
                  <p className="session-hint">
                    Think of your answer before flipping the card.
                  </p>
                )}
                {(flipped || result !== null) && result === null && (
                  <div className="review-buttons">
                    <button
                      type="button"
                      onClick={() => grade(false)}
                      disabled={pending}
                      className="review-again"
                    >
                      <RotateCcw size={16} /> Still learning
                    </button>
                    <button
                      type="button"
                      onClick={() => grade(true)}
                      disabled={pending}
                      className="review-known"
                    >
                      <Check size={16} /> I knew it
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="recall-card">
                <span className="card-eyebrow">
                  {mode === "quiz"
                    ? "CHOOSE THE BEST ANSWER"
                    : "WRITE WHAT YOU REMEMBER"}
                </span>
                <h2>{card.term}</h2>
                {mode === "write" ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (answer.trim())
                        grade(answerMatches(answer, card.definition));
                    }}
                  >
                    <label>
                      Your answer
                      <textarea
                        rows={4}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        maxLength={2000}
                        disabled={pending || result !== null}
                        required
                        placeholder="Try recalling it without looking…"
                      />
                    </label>
                    <p className="session-hint">
                      Written answers use exact wording, ignoring case and extra
                      spaces. A different but valid phrasing may be marked
                      incorrect.
                    </p>
                    {result === null && (
                      <button
                        className="button small"
                        disabled={pending || !answer.trim()}
                      >
                        Check answer <ArrowRight size={14} />
                      </button>
                    )}
                  </form>
                ) : (
                  <div className="quiz-options">
                    {options.map((option, i) => (
                      <button
                        type="button"
                        key={option}
                        className={
                          result !== null && option === card.definition
                            ? "quiz-correct"
                            : result === false && option === answer
                              ? "quiz-incorrect"
                              : ""
                        }
                        disabled={pending || result !== null}
                        onClick={() => {
                          setAnswer(option);
                          grade(option === card.definition);
                        }}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {error && (
              <p className="notice" role="alert">
                {error}
              </p>
            )}
            {pending && (
              <p className="session-saving" role="status">
                Saving your review…
              </p>
            )}
            {result !== null && (
              <div
                className={
                  "answer-result " + (result ? "correct" : "incorrect")
                }
                role="status"
              >
                <span>
                  {result ? <CheckCheck size={19} /> : <X size={19} />}
                </span>
                <div>
                  <strong>
                    {result
                      ? "Nice work. That one’s sticking."
                      : "Another step toward remembering."}
                  </strong>
                  {!result && <p>The answer: {card.definition}</p>}
                </div>
                <button type="button" className="button small" onClick={next}>
                  {index === order.length - 1 ? "See results" : "Next card"}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </section>
          <p className="session-footnote">
            <Layers size={13} /> Private to your account. Progress saves only
            after you submit a review.
          </p>
        </>
      )}
    </div>
  );
}
