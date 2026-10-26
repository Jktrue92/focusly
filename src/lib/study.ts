export type StudyDeck = {
  id: string;
  title: string;
  description: string;
  color: string;
  created_at: string;
};
export type Flashcard = {
  id: string;
  deck_id: string;
  term: string;
  definition: string;
  source_excerpt: string;
  created_at: string;
};
export type StudyProgress = {
  card_id: string;
  known: boolean;
  review_count: number;
  last_reviewed: string;
};
export function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}
export function answerMatches(answer: string, expected: string) {
  return normalizeAnswer(answer) === normalizeAnswer(expected);
}
export function shuffled<T>(values: T[], random: () => number = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function quizChoices(
  card: Flashcard,
  cards: Flashcard[],
  random: () => number = Math.random,
) {
  const seen = new Set([normalizeAnswer(card.definition)]);
  const other = cards.filter((c) => {
    const value = normalizeAnswer(c.definition);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
  if (other.length < 3) return [];
  return shuffled(
    [
      card.definition,
      ...shuffled(other, random)
        .slice(0, 3)
        .map((c) => c.definition),
    ],
    random,
  );
}
export function quizAvailable(cards: Flashcard[]) {
  return new Set(cards.map((c) => normalizeAnswer(c.definition))).size >= 4;
}
