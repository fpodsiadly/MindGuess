import { answerAkiAction, backAkiAction, getInitialAkiState, resetAkiAction, startAkiAction } from '@/app/actions/akinator';
import type { AkiViewState } from '@/app/actions/akinator';

jest.mock('@aqul/akinator-api', () => {
  class FakeAkinator {
    region: string;
    childMode: boolean;
    step = 0;
    progress = 0;
    question = 'Q1';
    isWin = false;
    suggestion_name = '';
    suggestion_desc = '';
    suggestion_photo = '';
    session = 's';
    signature = 'sig';
    baseUrl = 'u';
    sid = 1;
    step_last = 0;
    constructor(opts: { region: string; childMode: boolean }) {
      this.region = opts.region;
      this.childMode = opts.childMode;
    }
    async start() {}
    async answer() {}
    async cancelAnswer() { this.step = Math.max(0, this.step - 1); }
  }
  return { Akinator: FakeAkinator };
});

// Mock cookies
jest.mock('next/headers', () => {
  const store = new Map<string, string>();
  return {
    cookies: () => ({
      get: (k: string) => (store.has(k) ? { value: store.get(k)! } : undefined),
      set: (k: string, v: string) => { store.set(k, v); },
      delete: (k: string) => { store.delete(k); },
    }),
  };
});

describe('actions', () => {
  beforeEach(() => {
    // clear cookie store
    const { cookies } = jest.requireMock('next/headers');
    const jar = cookies();
    jar.delete('akinator-state');
  });

  it('getInitialAkiState returns idle when no cookie', async () => {
    const state = await getInitialAkiState();
    expect(state.status).toBe('idle');
  });

  it('startAkiAction starts a new session', async () => {
    const state = await startAkiAction('en');
    expect(state.region).toBe('en');
    expect(state.status).toBe('question');
  });

  it('resetAkiAction starts fresh and clears cookie', async () => {
    const initial = await startAkiAction('pl');
    const after = await resetAkiAction('en');
    expect(after.region).toBe('en');
    expect(after.status).toBe('question');
    expect(after.question).toBeDefined();
  });

  it('answerAkiAction returns idle message when no stored state', async () => {
    const state = await answerAkiAction(0);
    expect(state.status).toBe('idle');
    expect(state.message).toBeDefined();
  });

  it('backAkiAction returns idle message when no stored state', async () => {
    const state = await backAkiAction();
    expect(state.status).toBe('idle');
    expect(state.message).toBeDefined();
  });
});
