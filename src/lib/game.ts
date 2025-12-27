import { Prisma, TraitValue } from "@prisma/client";

export type AnswerOption = "yes" | "no" | "unknown";
export type TraitValueOption = "true" | "false" | "unknown";
export type GameMode = "question" | "guess" | "learn" | "done" | "empty";

export type TraitSummary = {
  id: string;
  key: string;
  question: string;
};

export type GuessCandidate = {
  id: string;
  name: string;
  confidence: number;
};

export type GameViewState = {
  mode: GameMode;
  questionCount: number;
  candidateCount: number;
  currentQuestion?: TraitSummary;
  guess?: GuessCandidate;
  answers: Record<string, AnswerOption>;
  history: Array<{ traitKey: string; question: string; answer: AnswerOption }>;
  traits: TraitSummary[];
  message?: string;
};

export type StoredGameState = {
  answers: Record<string, AnswerOption>;
  askedOrder: string[];
  questionCount: number;
};

export const emptyStoredState: StoredGameState = {
  answers: {},
  askedOrder: [],
  questionCount: 0,
};

export type PersonWithTraits = Prisma.PersonGetPayload<{
  include: {
    traits: {
      include: {
        trait: true;
      };
    };
  };
}>;

const log2 = (value: number) => Math.log(value) / Math.log(2);

const traitValueMatchesAnswer = (
  value: TraitValue,
  answer: AnswerOption,
) => {
  if (answer === "unknown") return true;
  if (value === TraitValue.UNKNOWN) return true;
  if (answer === "yes") return value === TraitValue.TRUE;
  return value === TraitValue.FALSE;
};

const mapPersonTraitValues = (person: PersonWithTraits) => {
  const map: Record<string, TraitValue> = {};
  for (const entry of person.traits) {
    map[entry.trait.key] = entry.value;
  }
  return map;
};

export const filterCandidates = (
  persons: PersonWithTraits[],
  answers: Record<string, AnswerOption>,
) => {
  if (!Object.keys(answers).length) return persons;

  return persons.filter((person) => {
    const traitMap = mapPersonTraitValues(person);

    return Object.entries(answers).every(([traitKey, answer]) => {
      const value = traitMap[traitKey];
      if (!value || value === TraitValue.UNKNOWN) return true;
      return traitValueMatchesAnswer(value, answer);
    });
  });
};

const computeEntropy = (
  candidates: PersonWithTraits[],
  traitKey: string,
): number => {
  let yesCount = 0;
  let noCount = 0;

  for (const person of candidates) {
    const traitMap = mapPersonTraitValues(person);
    const value = traitMap[traitKey];
    if (!value || value === TraitValue.UNKNOWN) continue;
    if (value === TraitValue.TRUE) yesCount += 1;
    if (value === TraitValue.FALSE) noCount += 1;
  }

  const known = yesCount + noCount;
  if (known === 0) return 0;

  const pYes = yesCount / known;
  const pNo = noCount / known;
  const entropy =
    (pYes ? -pYes * log2(pYes) : 0) + (pNo ? -pNo * log2(pNo) : 0);

  const coverage = known / Math.max(candidates.length, 1);
  return entropy * coverage;
};

export const selectNextQuestion = (
  traits: TraitSummary[],
  candidates: PersonWithTraits[],
  answers: Record<string, AnswerOption>,
): { trait: TraitSummary; score: number } | null => {
  let best: { trait: TraitSummary; score: number } | null = null;

  for (const trait of traits) {
    if (answers[trait.key]) continue;
    const score = computeEntropy(candidates, trait.key);
    if (!best || score > best.score) {
      best = { trait, score };
    }
  }

  return best;
};

const scoreCandidate = (
  person: PersonWithTraits,
  answers: Record<string, AnswerOption>,
) => {
  const traitMap = mapPersonTraitValues(person);
  let matches = 0;
  let considered = 0;

  for (const [traitKey, answer] of Object.entries(answers)) {
    if (answer === "unknown") continue;
    const value = traitMap[traitKey];
    if (!value || value === TraitValue.UNKNOWN) continue;
    considered += 1;
    if (traitValueMatchesAnswer(value, answer)) {
      matches += 1;
    }
  }

  if (considered === 0) return 0;
  return matches / considered;
};

const guessCandidate = (
  candidates: PersonWithTraits[],
  answers: Record<string, AnswerOption>,
): GuessCandidate | undefined => {
  if (!candidates.length) return undefined;

  let best = candidates[0];
  let bestScore = scoreCandidate(best, answers);

  for (const person of candidates.slice(1)) {
    const currentScore = scoreCandidate(person, answers);
    if (currentScore > bestScore) {
      best = person;
      bestScore = currentScore;
    }
  }

  const uniform = 1 / Math.max(candidates.length, 1);
  const confidence = Number(Math.max(bestScore, uniform).toFixed(3));

  return {
    id: best.id,
    name: best.name,
    confidence,
  };
};

export const deriveHistory = (
  askedOrder: string[],
  answers: Record<string, AnswerOption>,
  traitsByKey: Record<string, TraitSummary>,
) =>
  askedOrder
    .filter((key) => Boolean(traitsByKey[key]))
    .map((traitKey) => ({
      traitKey,
      question: traitsByKey[traitKey].question,
      answer: answers[traitKey] ?? "unknown",
    }));

export const deriveState = (
  persons: PersonWithTraits[],
  traits: TraitSummary[],
  storedState: StoredGameState,
): GameViewState => {
  const traitsByKey = traits.reduce<Record<string, TraitSummary>>((acc, trait) => {
    acc[trait.key] = trait;
    return acc;
  }, {});

  if (traits.length === 0) {
    return {
      mode: "empty",
      questionCount: storedState.questionCount,
      candidateCount: 0,
      answers: storedState.answers,
      history: [],
      traits,
      message: "Add traits to start playing.",
    };
  }

  if (persons.length === 0) {
    return {
      mode: "empty",
      questionCount: storedState.questionCount,
      candidateCount: 0,
      answers: storedState.answers,
      history: [],
      traits,
      message: "No people in the database yet.",
    };
  }

  const candidates = filterCandidates(persons, storedState.answers);
  const candidateCount = candidates.length;
  const history = deriveHistory(storedState.askedOrder, storedState.answers, traitsByKey);

  if (candidateCount === 0) {
    return {
      mode: "learn",
      questionCount: storedState.questionCount,
      candidateCount,
      answers: storedState.answers,
      history,
      traits,
      message: "I ran out of candidates. Tell me who you were thinking of.",
    };
  }

  const next = selectNextQuestion(traits, candidates, storedState.answers);
  const guess = guessCandidate(candidates, storedState.answers);
  const shouldGuess =
    candidateCount === 1 ||
    !next ||
    (candidateCount <= 3 && next.score < 0.2) ||
    storedState.questionCount >= 20;

  if (shouldGuess && guess) {
    return {
      mode: "guess",
      questionCount: storedState.questionCount,
      candidateCount,
      answers: storedState.answers,
      history,
      traits,
      guess,
      message: candidateCount === 1 ? "I am confident about this one." : undefined,
    };
  }

  if (next) {
    return {
      mode: "question",
      questionCount: storedState.questionCount,
      candidateCount,
      currentQuestion: next.trait,
      answers: storedState.answers,
      history,
      traits,
    };
  }

  return {
    mode: "guess",
    questionCount: storedState.questionCount,
    candidateCount,
    answers: storedState.answers,
    history,
    traits,
    guess,
    message: "No more useful questions left.",
  };
};
