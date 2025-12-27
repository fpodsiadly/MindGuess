"use client";

import { useMemo, useState, useTransition } from "react";
import { AnswerOption, GameViewState, TraitValueOption } from "@/lib/game";
import {
    addPersonAction,
    answerQuestionAction,
    confirmGuessAction,
    resetGameAction,
} from "@/app/actions/game";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Props = {
    initialState: GameViewState;
};

const answerLabels: Record<AnswerOption, string> = {
    yes: "Yes",
    no: "No",
    unknown: "I don't know",
};

const traitOptions: Array<{ value: TraitValueOption; label: string }> = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
    { value: "unknown", label: "Not sure" },
];

export function GameShell({ initialState }: Props) {
    const [state, setState] = useState<GameViewState>(initialState);
    const [isPending, startTransition] = useTransition();

    const [personName, setPersonName] = useState("");
    const [traitValues, setTraitValues] = useState<Record<string, TraitValueOption>>({});
    const [newTraitKey, setNewTraitKey] = useState("");
    const [newTraitQuestion, setNewTraitQuestion] = useState("");
    const [newTraitValue, setNewTraitValue] = useState<TraitValueOption>("unknown");

    const progressValue = useMemo(() => {
        const capped = Math.min(state.questionCount, 20);
        return Math.min((capped / 20) * 100, 100);
    }, [state.questionCount]);

    const history = state.history ?? [];

    const resolvedTraitValues = useMemo(() => {
        const base = state.traits.reduce<Record<string, TraitValueOption>>((acc, trait) => {
            acc[trait.key] = "unknown";
            return acc;
        }, {});
        return { ...base, ...traitValues };
    }, [state.traits, traitValues]);

    const resetForms = () => {
        setPersonName("");
        setTraitValues({});
        setNewTraitKey("");
        setNewTraitQuestion("");
        setNewTraitValue("unknown");
    };

    const handleAnswer = (answer: AnswerOption) => {
        if (!state.currentQuestion) return;
        startTransition(async () => {
            const next = await answerQuestionAction({
                traitKey: state.currentQuestion!.key,
                answer,
            });
            setState(next);
        });
    };

    const handleConfirmGuess = (correct: boolean) => {
        startTransition(async () => {
            const next = await confirmGuessAction(correct);
            setState(next);
            if (correct) resetForms();
        });
    };

    const handleAddPerson = () => {
        startTransition(async () => {
            const payload = {
                name: personName,
                traitValues: resolvedTraitValues,
                newTrait:
                    newTraitKey.trim() && newTraitQuestion.trim()
                        ? {
                            key: newTraitKey,
                            question: newTraitQuestion,
                            value: newTraitValue,
                        }
                        : undefined,
            };

            const next = await addPersonAction(payload);
            setState(next);
            resetForms();
        });
    };

    const handleReset = () => {
        startTransition(async () => {
            const next = await resetGameAction();
            setState(next);
            resetForms();
        });
    };

    const updateTraitValue = (key: string, value: TraitValueOption) => {
        setTraitValues((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">MindGuess</p>
                        <h1 className="text-2xl font-semibold text-slate-900">Think of a person. I will guess.</h1>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleReset} disabled={isPending}>
                        Reset
                    </Button>
                </div>

                <Card>
                    <CardHeader className="space-y-3">
                        <CardTitle className="flex items-center justify-between text-lg font-semibold">
                            <span>Session</span>
                            <span className="text-sm font-normal text-slate-500">
                                {state.questionCount} questions · {state.candidateCount} candidates
                            </span>
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                            Odpowiadaj: TAK / NIE / NIE WIEM. Zadawaj jak najmniej pytań.
                        </CardDescription>
                        <div className="space-y-1">
                            <Progress value={progressValue} className="h-2" />
                            <p className="text-xs text-slate-500">Progress based on 20-question budget.</p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {state.message && <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">{state.message}</div>}

                        {state.mode === "question" && state.currentQuestion && (
                            <div className="space-y-4">
                                <div className="space-y-2 text-center sm:text-left">
                                    <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Pytanie</p>
                                    <p className="text-2xl font-semibold text-slate-900">{state.currentQuestion.question}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {(Object.keys(answerLabels) as AnswerOption[]).map((value) => (
                                        <Button
                                            key={value}
                                            onClick={() => handleAnswer(value)}
                                            variant={value === "unknown" ? "outline" : "default"}
                                            disabled={isPending}
                                            className="w-full text-base py-3"
                                        >
                                            {value === "unknown" ? "Nie wiem" : value === "yes" ? "Tak" : "Nie"}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {state.mode === "guess" && state.guess && (
                            <div className="space-y-3">
                                <p className="text-sm font-medium uppercase tracking-[0.1em] text-slate-500">My guess</p>
                                <p className="text-2xl font-semibold text-slate-900">{state.guess.name}</p>
                                <p className="text-sm text-slate-600">Confidence: {(state.guess.confidence * 100).toFixed(0)}%</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <Button onClick={() => handleConfirmGuess(true)} disabled={isPending} className="w-full">
                                        Yes, you are right
                                    </Button>
                                    <Button
                                        onClick={() => handleConfirmGuess(false)}
                                        variant="secondary"
                                        disabled={isPending}
                                        className="w-full"
                                    >
                                        No, try learning
                                    </Button>
                                    <Button onClick={handleReset} variant="outline" disabled={isPending} className="w-full">
                                        Start over
                                    </Button>
                                </div>
                            </div>
                        )}

                        {state.mode === "learn" && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.1em] text-slate-500">Teach me</p>
                                    <p className="text-xl font-semibold text-slate-900">Who were you thinking of?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="person-name">Name</Label>
                                        <Input
                                            id="person-name"
                                            placeholder="e.g. Ada Lovelace"
                                            value={personName}
                                            onChange={(e) => setPersonName(e.target.value)}
                                            disabled={isPending}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-slate-700">Trait values</p>
                                        <div className="space-y-3">
                                            {state.traits.map((trait) => (
                                                <div key={trait.key} className="space-y-2 rounded-lg border border-slate-200 p-3">
                                                    <div className="text-sm font-medium text-slate-800">{trait.question}</div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {traitOptions.map((option) => (
                                                            <Button
                                                                key={option.value}
                                                                type="button"
                                                                variant={traitValues[trait.key] === option.value ? "default" : "outline"}
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => updateTraitValue(trait.key, option.value)}
                                                                disabled={isPending}
                                                            >
                                                                {option.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3 rounded-lg border border-dashed border-slate-200 p-4">
                                        <p className="text-sm font-medium text-slate-800">Add a new trait (optional)</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="trait-key">Trait key</Label>
                                                <Input
                                                    id="trait-key"
                                                    placeholder="unique-key"
                                                    value={newTraitKey}
                                                    onChange={(e) => setNewTraitKey(e.target.value)}
                                                    disabled={isPending}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="trait-question">Question</Label>
                                                <Input
                                                    id="trait-question"
                                                    placeholder="What question should I ask?"
                                                    value={newTraitQuestion}
                                                    onChange={(e) => setNewTraitQuestion(e.target.value)}
                                                    disabled={isPending}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Answer for this person</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {traitOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        type="button"
                                                        variant={newTraitValue === option.value ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => setNewTraitValue(option.value)}
                                                        disabled={isPending}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(state.mode === "empty" || state.mode === "done") && (
                            <div className="space-y-4">
                                <p className="text-lg font-semibold text-slate-900">{state.message ?? "Zaczynamy nową grę?"}</p>
                                <Button onClick={handleReset} disabled={isPending} className="w-full sm:w-auto">
                                    Start a new game
                                </Button>
                            </div>
                        )}
                    </CardContent>

                    {state.mode === "learn" && (
                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <Button onClick={handleAddPerson} disabled={isPending} className="w-full sm:w-auto">
                                Save person & restart
                            </Button>
                            <Button variant="outline" onClick={handleReset} disabled={isPending} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </CardFooter>
                    )}

                    {state.mode === "question" || state.mode === "guess" ? (
                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-500">
                                {isPending ? "Myślę..." : "Odpowiedz, aby kontynuować."}
                            </div>
                            <Button variant="outline" size="sm" onClick={handleReset} disabled={isPending}>
                                Resetuj grę
                            </Button>
                        </CardFooter>
                    ) : null}
                </Card>
                {history.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Historia odpowiedzi</CardTitle>
                            <CardDescription className="text-sm text-slate-600">
                                Co już padło w tej sesji.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {history.map((item) => (
                                <div key={item.traitKey} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{item.question}</p>
                                        <p className="text-xs text-slate-500">Klucz: {item.traitKey}</p>
                                    </div>
                                    <span
                                        className={cn(
                                            "rounded-full px-3 py-1 text-xs font-semibold",
                                            item.answer === "yes" && "bg-emerald-50 text-emerald-700",
                                            item.answer === "no" && "bg-rose-50 text-rose-700",
                                            item.answer === "unknown" && "bg-slate-100 text-slate-700",
                                        )}
                                    >
                                        {item.answer === "yes" ? "Tak" : item.answer === "no" ? "Nie" : "Nie wiem"}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}