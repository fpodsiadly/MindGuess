'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  AnswerOption,
  GameViewState,
  StoredGameState,
  TraitSummary,
  TraitValueOption,
  emptyStoredState,
  deriveState,
} from '@/lib/game';
import { TraitValue } from '@prisma/client';

const STATE_COOKIE = 'mindguess-state';
const STATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type AnswerInput = {
  traitKey: string;
  answer: AnswerOption;
};

type AddPersonInput = {
  name: string;
  traitValues: Record<string, TraitValueOption>;
  newTrait?: {
    key: string;
    question: string;
    value: TraitValueOption;
  };
};

const safeParseState = (raw?: string | null): StoredGameState => {
  if (!raw) return { ...emptyStoredState };
  try {
    const parsed = JSON.parse(raw) as StoredGameState;
    return {
      answers: parsed.answers ?? {},
      askedOrder: parsed.askedOrder ?? [],
      questionCount: parsed.questionCount ?? 0,
    };
  } catch {
    return { ...emptyStoredState };
  }
};

const readStoredState = async (): Promise<StoredGameState> => {
  const store = await cookies();
  const raw = store.get(STATE_COOKIE)?.value;
  return safeParseState(raw);
};

const writeStoredState = async (state: StoredGameState) => {
  const store = await cookies();
  store.set(STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE,
  });
};

const clearStoredState = async () => {
  const store = await cookies();
  store.delete(STATE_COOKIE);
};

const fetchData = async () => {
  const [traits, persons] = await Promise.all([
    prisma.trait.findMany({ orderBy: { key: 'asc' } }),
    prisma.person.findMany({
      include: { traits: { include: { trait: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const traitSummaries: TraitSummary[] = traits.map((trait) => ({
    id: trait.id,
    key: trait.key,
    question: trait.question,
  }));

  return { traits, persons, traitSummaries };
};

export const getInitialState = async (): Promise<GameViewState> => {
  const stored = await readStoredState();
  const { persons, traitSummaries } = await fetchData();
  return deriveState(persons, traitSummaries, stored);
};

export const answerQuestionAction = async (
  input: AnswerInput,
): Promise<GameViewState> => {
  const { traitKey, answer } = input;
  if (!traitKey) {
    throw new Error('Missing trait key');
  }

  const stored = await readStoredState();
  const nextState: StoredGameState = {
    answers: {
      ...stored.answers,
      [traitKey]: answer,
    },
    askedOrder: stored.askedOrder.includes(traitKey)
      ? stored.askedOrder
      : [...stored.askedOrder, traitKey],
    questionCount: stored.questionCount + 1,
  };

  await writeStoredState(nextState);
  const { persons, traitSummaries } = await fetchData();
  return deriveState(persons, traitSummaries, nextState);
};

export const confirmGuessAction = async (
  correct: boolean,
): Promise<GameViewState> => {
  const stored = await readStoredState();
  const { persons, traitSummaries } = await fetchData();

  if (correct) {
    await clearStoredState();
    const base = deriveState(persons, traitSummaries, emptyStoredState);
    return {
      ...base,
      mode: 'done',
      message: 'Got it! Want to play again?',
    };
  }

  return {
    ...deriveState(persons, traitSummaries, stored),
    mode: 'learn',
    message: 'Help me learn who you were thinking of.',
  };
};

const toTraitValue = (value: TraitValueOption): TraitValue => {
  if (value === 'true') return TraitValue.TRUE;
  if (value === 'false') return TraitValue.FALSE;
  return TraitValue.UNKNOWN;
};

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

export const addPersonAction = async (
  payload: AddPersonInput,
): Promise<GameViewState> => {
  const name = payload.name.trim();
  if (!name) {
    throw new Error('Please provide a name for the new person.');
  }

  const { traitSummaries } = await fetchData();
  const traitMap = traitSummaries.reduce<Record<string, TraitSummary>>((acc, trait) => {
    acc[trait.key] = trait;
    return acc;
  }, {});

  let newTraitKeyNormalized: string | undefined;

  if (payload.newTrait?.key && payload.newTrait.question) {
    const normalizedKey = normalizeKey(payload.newTrait.key);
    const created = await prisma.trait.upsert({
      where: { key: normalizedKey },
      update: { question: payload.newTrait.question.trim() },
      create: { key: normalizedKey, question: payload.newTrait.question.trim() },
    });
    newTraitKeyNormalized = created.key;
    traitMap[created.key] = {
      id: created.id,
      key: created.key,
      question: created.question,
    };
  }

  const traitValueEntries = Object.entries(payload.traitValues ?? {});

  await prisma.person.create({
    data: {
      name,
      traits: {
        create: traitValueEntries
          .filter(([key]) => traitMap[key])
          .map(([key, value]) => ({
            trait: { connect: { key } },
            value: toTraitValue(value),
          }))
          .concat(
            newTraitKeyNormalized
              ? [
                  {
                    trait: { connect: { key: newTraitKeyNormalized } },
                    value: toTraitValue(payload.newTrait?.value ?? 'unknown'),
                  },
                ]
              : [],
          ),
      },
    },
  });

  await clearStoredState();
  revalidatePath('/');

  const refreshed = await fetchData();
  return {
    ...deriveState(refreshed.persons, refreshed.traitSummaries, emptyStoredState),
    mode: 'done',
    message: 'Thanks! I learned someone new. Want to play again?',
  };
};

export const resetGameAction = async (): Promise<GameViewState> => {
  await clearStoredState();
  const { persons, traitSummaries } = await fetchData();
  return deriveState(persons, traitSummaries, emptyStoredState);
};
