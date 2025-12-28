import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AkinatorShell } from '@/components/akinator-shell';
import type { AkiViewState } from '@/app/actions/akinator';

jest.mock('@/app/actions/akinator', () => ({
    startAkiAction: jest.fn(async () => mockState),
    answerAkiAction: jest.fn(async () => mockState),
    backAkiAction: jest.fn(async () => mockState),
    resetAkiAction: jest.fn(async () => mockState),
}));

const mockState: AkiViewState = {
    status: 'question',
    region: 'pl',
    question: 'Czy Twoja postać jest dziewczyną?',
    progress: 12,
    step: 0,
    canBack: true,
};

describe('AkinatorShell', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders question and answers', () => {
        render(<AkinatorShell initialState={mockState} />);

        expect(screen.getByText(/Czy Twoja postać jest dziewczyną?/i)).toBeInTheDocument();
        expect(screen.getByText('Tak')).toBeInTheDocument();
        expect(screen.getByText('Nie')).toBeInTheDocument();
        expect(screen.getByText('Nie wiem')).toBeInTheDocument();
    });

    it('calls answer action when clicking an option', async () => {
        const user = userEvent.setup();
        const { answerAkiAction } = jest.requireMock('@/app/actions/akinator');

        render(<AkinatorShell initialState={mockState} />);

        await user.click(screen.getByText('Tak'));

        expect(answerAkiAction).toHaveBeenCalled();
    });

    it('calls back action when clicking Cofnij', async () => {
        const user = userEvent.setup();
        const { backAkiAction } = jest.requireMock('@/app/actions/akinator');

        render(<AkinatorShell initialState={mockState} />);

        await user.click(screen.getByText('Cofnij'));

        expect(backAkiAction).toHaveBeenCalled();
    });

    it('calls reset action when clicking Resetuj grę', async () => {
        const user = userEvent.setup();
        const { resetAkiAction } = jest.requireMock('@/app/actions/akinator');

        render(<AkinatorShell initialState={mockState} />);

        await user.click(screen.getByText('Resetuj grę'));

        expect(resetAkiAction).toHaveBeenCalled();
    });
});
