'use server';

import { cookies } from 'next/headers';
import { Akinator, AkinatorAnswer } from '@aqul/akinator-api';

export type AkiRegion = 'pl' | 'en';

export type AkiViewState = {
  status: 'idle' | 'question' | 'guess';
  region: AkiRegion;
  question?: string;
  progress: number;
  guess?: {
    name: string;
    description: string;
    photo?: string;
  };
  canBack: boolean;
  message?: string;
};

type StoredAki = {
  region: AkiRegion;
  session: string;
  signature: string;
  baseUrl: string;
  sid: number;
  step: number;
  progress: number;
  question: string;
  isWin: boolean;
  sugestion_name?: string;
  sugestion_desc?: string;
  sugestion_photo?: string;
  step_last?: number;
  childMode: boolean;
};

type AkinatorInternal = {
  session: string;
  signature: string;
  baseUrl: string;
  sid: number;
  step: number;
  progress: number;
  question: string;
  isWin: boolean;
  sugestion_name?: string;
  sugestion_desc?: string;
  sugestion_photo?: string;
  step_last?: number;
  childMode?: boolean;
};

const asInternal = (api: Akinator): AkinatorInternal => api as unknown as AkinatorInternal;

const STATE_COOKIE = 'akinator-state';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ensureRegion = (value?: string | null): AkiRegion => (value === 'en' ? 'en' : 'pl');

const readStored = async (): Promise<StoredAki | null> => {
  const store = await cookies();
  const raw = store.get(STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAki;
  } catch {
    return null;
  }
};

const writeStored = async (state: StoredAki) => {
  const store = await cookies();
  store.set(STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
  });
};

const clearStored = async () => {
  const store = await cookies();
  store.delete(STATE_COOKIE);
};

const toStored = (api: Akinator, region: AkiRegion): StoredAki => {
  const apiInt = asInternal(api);
  return {
    region,
    session: apiInt.session,
    signature: apiInt.signature,
    baseUrl: apiInt.baseUrl,
    sid: apiInt.sid,
    step: apiInt.step,
    progress: apiInt.progress,
    question: apiInt.question,
    isWin: apiInt.isWin,
    sugestion_name: apiInt.sugestion_name,
    sugestion_desc: apiInt.sugestion_desc,
    sugestion_photo: apiInt.sugestion_photo,
    step_last: apiInt.step_last,
    childMode: apiInt.childMode ?? false,
  } satisfies StoredAki;
};

const hydrate = (stored: StoredAki): Akinator => {
  const api = new Akinator({ region: stored.region, childMode: stored.childMode });
  const apiInt = asInternal(api);
  apiInt.session = stored.session;
  apiInt.signature = stored.signature;
  apiInt.baseUrl = stored.baseUrl;
  apiInt.sid = stored.sid;
  apiInt.step = stored.step;
  apiInt.progress = stored.progress;
  apiInt.question = stored.question;
  apiInt.isWin = stored.isWin;
  apiInt.sugestion_name = stored.sugestion_name ?? '';
  apiInt.sugestion_desc = stored.sugestion_desc ?? '';
  apiInt.sugestion_photo = stored.sugestion_photo ?? '';
  apiInt.step_last = stored.step_last;
  return api;
};

const toView = (api: Akinator, region: AkiRegion): AkiViewState => {
  const apiInt = asInternal(api);
  return {
    status: api.isWin ? 'guess' : 'question',
    region,
    question: api.question,
    progress: api.progress,
    guess: api.isWin
      ? {
          name: apiInt.sugestion_name ?? '',
          description: apiInt.sugestion_desc ?? '',
          photo: apiInt.sugestion_photo ?? '',
        }
      : undefined,
    canBack: apiInt.step > 0,
  } satisfies AkiViewState;
};

export const getInitialAkiState = async (): Promise<AkiViewState> => {
  const stored = await readStored();
  if (!stored) {
    return { status: 'idle', region: 'pl', progress: 0, canBack: false };
  }

  try {
    const api = hydrate(stored);
    return toView(api, stored.region);
  } catch {
    await clearStored();
    return { status: 'idle', region: 'pl', progress: 0, canBack: false };
  }
};

export const startAkiAction = async (region?: string): Promise<AkiViewState> => {
  const lang = ensureRegion(region);
  const api = new Akinator({ region: lang, childMode: false });
  await api.start();
  await writeStored(toStored(api, lang));
  return toView(api, lang);
};

export const answerAkiAction = async (answer: number): Promise<AkiViewState> => {
  const stored = await readStored();
  if (!stored) {
    return { status: 'idle', region: 'pl', progress: 0, canBack: false, message: 'Najpierw rozpocznij grę.' };
  }

  const api = hydrate(stored);
  const safeAnswer = Math.max(0, Math.min(4, answer));
  await api.answer(safeAnswer as AkinatorAnswer);
  const nextStored = toStored(api, stored.region);
  await writeStored(nextStored);
  return toView(api, stored.region);
};

export const backAkiAction = async (): Promise<AkiViewState> => {
  const stored = await readStored();
  if (!stored) {
    return { status: 'idle', region: 'pl', progress: 0, canBack: false, message: 'Najpierw rozpocznij grę.' };
  }

  const api = hydrate(stored);
  if (asInternal(api).step > 0) {
    await api.cancelAnswer();
  }
  const nextStored = toStored(api, stored.region);
  await writeStored(nextStored);
  return toView(api, stored.region);
};

export const resetAkiAction = async (): Promise<AkiViewState> => {
  await clearStored();
  return { status: 'idle', region: 'pl', progress: 0, canBack: false };
};