"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
    AkiRegion,
    AkiViewState,
    answerAkiAction,
    backAkiAction,
    resetAkiAction,
    startAkiAction,
} from "@/app/actions/akinator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const answerOptions = [
    { value: 0, key: "yes", labelPl: "Tak", labelEn: "Yes" },
    { value: 1, key: "no", labelPl: "Nie", labelEn: "No" },
    { value: 2, key: "dk", labelPl: "Nie wiem", labelEn: "Don't know" },
    { value: 3, key: "prob", labelPl: "Prawdopodobnie", labelEn: "Probably" },
    { value: 4, key: "probnot", labelPl: "Raczej nie", labelEn: "Probably not" },
] as const;

const regionLabel: Record<AkiRegion, string> = { pl: "Polski", en: "English" };

export function AkinatorShell({ initialState }: { initialState: AkiViewState }) {
    const [state, setState] = useState<AkiViewState>(initialState);
    const [region, setRegion] = useState<AkiRegion>(initialState.region ?? "pl");
    const [isPending, startTransition] = useTransition();

    const progressValue = useMemo(() => Math.min(state.progress ?? 0, 100), [state.progress]);

    const handleStart = (nextRegion?: AkiRegion) => {
        const lang = nextRegion ?? region;
        startTransition(async () => {
            const next = await startAkiAction(lang);
            setRegion(lang);
            setState(next);
        });
    };

    const handleAnswer = (value: number) => {
        startTransition(async () => {
            const next = await answerAkiAction(value);
            setState(next);
        });
    };

    const handleBack = () => {
        startTransition(async () => {
            const next = await backAkiAction();
            setState(next);
        });
    };

    const handleReset = () => {
        startTransition(async () => {
            const next = await resetAkiAction();
            setState(next);
        });
    };

    const languageSwitcher = (
        <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Język</span>
            <div className="flex gap-2">
                {(["pl", "en"] as AkiRegion[]).map((lang) => (
                    <Button
                        key={lang}
                        size="sm"
                        variant={region === lang ? "default" : "outline"}
                        onClick={() => handleStart(lang)}
                        disabled={isPending}
                    >
                        {regionLabel[lang]}
                    </Button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">MindGuess</p>
                        <h1 className="text-2xl font-semibold text-slate-900">Think of a person. I will guess.</h1>
                    </div>
                    {languageSwitcher}
                </div>

                <Card>
                    <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center justify-between text-lg font-semibold">
                            <span>Session</span>
                            <span className="text-sm font-normal text-slate-500">
                                {state.status === "question" ? "Pytania w toku" : "Gotowe"}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                            {region === "pl" ? "Odpowiadaj: TAK / NIE / NIE WIEM / Prawdopodobnie / Raczej nie." : "Answer: YES / NO / DON'T KNOW / PROBABLY / PROBABLY NOT."}
                        </CardDescription>
                        <div className="space-y-1">
                            <Progress value={progressValue} className="h-2" />
                            <p className="text-xs text-slate-500">Postęp: {progressValue.toFixed(0)}%</p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {state.status === "idle" && (
                            <div className="space-y-4">
                                <p className="text-lg font-semibold text-slate-900">Zacznij grę w stylu Akinatora.</p>
                                <Button onClick={() => handleStart()} disabled={isPending} className="w-full sm:w-auto">
                                    Start
                                </Button>
                            </div>
                        )}

                        {state.status === "question" && state.question && (
                            <div className="space-y-4">
                                <div className="space-y-2 text-center sm:text-left">
                                    <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">
                                        {region === "pl" ? "Pytanie" : "Question"}
                                    </p>
                                    <p className="text-2xl font-semibold text-slate-900">{state.question}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {answerOptions.map((opt) => (
                                        <Button
                                            key={opt.key}
                                            onClick={() => handleAnswer(opt.value)}
                                            disabled={isPending}
                                            variant={opt.value === 2 ? "outline" : "default"}
                                            className="w-full text-base py-3"
                                        >
                                            {region === "pl" ? opt.labelPl : opt.labelEn}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={handleBack} disabled={isPending || !state.canBack}>
                                        {region === "pl" ? "Cofnij" : "Back"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {state.status === "guess" && state.guess && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">{region === "pl" ? "Moja propozycja" : "My guess"}</p>
                                    <p className="text-2xl font-semibold text-slate-900">{state.guess.name}</p>
                                    {state.guess.description && (
                                        <p className="text-sm text-slate-600">{state.guess.description}</p>
                                    )}
                                    {state.guess.photo && (
                                        <div className="relative h-40 w-40 overflow-hidden rounded-md">
                                            <Image
                                                src={state.guess.photo}
                                                alt={state.guess.name}
                                                fill
                                                sizes="160px"
                                                className="object-cover"
                                                priority={false}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button onClick={() => handleStart(region)} disabled={isPending} className="w-full sm:w-auto">
                                        {region === "pl" ? "Zagraj ponownie" : "Play again"}
                                    </Button>
                                    <Button variant="outline" onClick={handleReset} disabled={isPending} className="w-full sm:w-auto">
                                        {region === "pl" ? "Reset" : "Reset"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {state.message && (
                            <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">{state.message}</div>
                        )}
                    </CardContent>

                    <CardFooter className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={handleReset} disabled={isPending}>
                            {region === "pl" ? "Resetuj grę" : "Reset game"}
                        </Button>
                        <span className="text-xs text-slate-500">{region === "pl" ? "Silnik: Akinator API" : "Powered by Akinator API"}</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
