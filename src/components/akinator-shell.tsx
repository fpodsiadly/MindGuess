"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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

const langStorageKey = "akinator-lang";

const getInitials = (value?: string) => {
    if (!value) return "?";
    const parts = value.split(" ").filter(Boolean);
    if (!parts.length) return "?";
    const [first, second] = parts;
    return (first[0] + (second?.[0] ?? "")).toUpperCase();
};

export function AkinatorShell({ initialState }: { initialState: AkiViewState }) {
    const [state, setState] = useState<AkiViewState>(initialState);
    const [region, setRegion] = useState<AkiRegion>(initialState.region ?? "pl");
    const [isPending, startTransition] = useTransition();
    const autoStarted = useRef(false);
    const [imageError, setImageError] = useState(false);

    const progressValue = useMemo(() => Math.min(state.progress ?? 0, 100), [state.progress]);

    const handleStart = useCallback(
        (nextRegion?: AkiRegion) => {
            const lang = nextRegion ?? region;
            startTransition(async () => {
                const next = await startAkiAction(lang);
                setRegion(lang);
                setState(next);
                try {
                    localStorage.setItem(langStorageKey, lang);
                } catch {
                    /* ignore */
                }
            });
        },
        [region],
    );

    useEffect(() => {
        try {
            const saved = localStorage.getItem(langStorageKey) as AkiRegion | null;
            if (saved && saved !== region) {
                setRegion(saved);
                if (state.status === "idle" && !autoStarted.current) {
                    autoStarted.current = true;
                    handleStart(saved);
                }
            }
        } catch {
            /* ignore */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (state.status === "idle" && !autoStarted.current) {
            autoStarted.current = true;
            handleStart(region);
        }
    }, [state.status, region, handleStart]);

    useEffect(() => {
        setImageError(false);
    }, [state.guess?.photo]);

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
            const next = await resetAkiAction(region);
            setState(next);
        });
    };

    const languageSwitcher = (
        <div className="flex items-center gap-2 text-sm text-red-100/80">
            <span className="text-xs uppercase tracking-[0.22em] text-red-200">Język</span>
            <div className="flex gap-2">
                {(["pl", "en"] as AkiRegion[]).map((lang) => (
                    <Button
                        key={lang}
                        size="sm"
                        variant={region === lang ? "default" : "outline"}
                        onClick={() => handleStart(lang)}
                        disabled={isPending}
                        className={
                            region === lang
                                ? "bg-gradient-to-r from-[#ff1f44] via-[#d1122f] to-[#ff1f44] text-red-50 shadow-[0_0_18px_rgba(255,31,68,0.45)] border border-red-500"
                                : "border border-red-500/70 bg-red-100/95 text-red-900 shadow-[0_0_12px_rgba(255,31,68,0.15)]"
                        }
                    >
                        {regionLabel[lang]}
                    </Button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b0c1a] via-[#0a0a14] to-[#0c0f1d] text-red-50">
            <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
                <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#ff1f44] blur-[160px]" aria-hidden="true" />
                <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#3c0d1f] blur-[180px]" aria-hidden="true" />
            </div>

            <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#ff3040] drop-shadow-[0_0_12px_rgba(255,48,64,0.65)]">
                            MindGuess
                        </p>
                        <h1 className="text-3xl font-semibold text-red-50 drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
                            Think of a person. I will guess.
                        </h1>
                    </div>
                    {languageSwitcher}
                </div>

                <Card className="border border-red-900/40 bg-[#0f111e]/90 shadow-[0_0_40px_rgba(255,31,68,0.18)] backdrop-blur">
                    <CardHeader className="space-y-3 border-b border-red-900/30 pb-5">
                        <CardTitle className="flex items-center justify-between text-lg font-semibold text-red-50">
                            <span className="tracking-wide">Session</span>
                            <div className="flex items-center gap-3 text-xs text-red-200/80">
                                <span>
                                    {state.status === "question" ? `${(state.step ?? 0) + 1} pytanie` : "Gotowe"}
                                </span>
                                <span className="opacity-80">Pewność: {progressValue.toFixed(0)}%</span>
                            </div>
                        </CardTitle>
                        <CardDescription className="text-sm text-red-100/80">
                            {region === "pl"
                                ? "Odpowiadaj: TAK / NIE / NIE WIEM / Prawdopodobnie / Raczej nie."
                                : "Answer: YES / NO / DON'T KNOW / PROBABLY / PROBABLY NOT."}
                        </CardDescription>
                        <div className="space-y-1">
                            <Progress value={progressValue} className="h-2 bg-red-950/50" />
                            <p className="text-xs text-red-200/80">Postęp: {progressValue.toFixed(0)}%</p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {state.status === "question" && state.question && (
                            <div className="space-y-5">
                                <div className="space-y-2 text-center sm:text-left">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                                        {region === "pl" ? "Pytanie" : "Question"}
                                    </p>
                                    {isPending ? (
                                        <div className="h-9 w-64 rounded bg-red-900/40 animate-pulse" />
                                    ) : (
                                        <p className="text-3xl font-semibold text-red-50 drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]">
                                            {state.question}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-3xl mx-auto w-full justify-items-center">
                                    {answerOptions.map((opt) => {
                                        const baseGradient = "bg-gradient-to-r from-[#ff1f44] via-[#d1122f] to-[#ff1f44] text-red-50 shadow-[0_0_22px_rgba(255,31,68,0.32)]";
                                        const neutral = "border border-red-500/70 bg-red-100/95 text-red-900 shadow-[0_0_12px_rgba(255,31,68,0.15)]";
                                        const classes = opt.value === 2 ? neutral : baseGradient;
                                        return (
                                            <Button
                                                key={opt.key}
                                                onClick={() => handleAnswer(opt.value)}
                                                disabled={isPending}
                                                className={`w-full transition-transform hover:scale-[1.01] ${classes}`}
                                            >
                                                {isPending ? "..." : region === "pl" ? opt.labelPl : opt.labelEn}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBack}
                                        disabled={isPending || !state.canBack}
                                        className="text-red-100 hover:text-red-50 hover:bg-red-900/30"
                                    >
                                        {region === "pl" ? "Cofnij" : "Back"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {state.status === "guess" && state.guess && (
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">{region === "pl" ? "Moja propozycja" : "My guess"}</p>
                                    <p className="text-3xl font-semibold text-red-50 drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]">{state.guess.name}</p>
                                    {state.guess.description && (
                                        <p className="text-sm text-red-100/80">{state.guess.description}</p>
                                    )}
                                    {state.guess.photo && !imageError ? (
                                        <div className="relative h-44 w-44 overflow-hidden rounded-md border border-red-900/50 shadow-[0_0_30px_rgba(255,31,68,0.25)]">
                                            <Image
                                                src={state.guess.photo}
                                                alt={state.guess.name}
                                                fill
                                                sizes="176px"
                                                className="object-cover"
                                                priority={false}
                                                onError={() => setImageError(true)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-44 w-44 items-center justify-center rounded-md border border-red-900/50 bg-gradient-to-br from-red-900/70 to-red-700/60 text-3xl font-semibold text-red-50 shadow-[0_0_30px_rgba(255,31,68,0.25)]">
                                            {getInitials(state.guess.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        onClick={() => handleStart(region)}
                                        disabled={isPending}
                                        className="w-full bg-gradient-to-r from-[#ff1f44] via-[#d1122f] to-[#ff1f44] text-red-50 shadow-[0_0_22px_rgba(255,31,68,0.32)] hover:scale-[1.01]"
                                    >
                                        {region === "pl" ? "Zagraj ponownie" : "Play again"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={isPending}
                                        className="w-full border border-red-600/40 text-red-100 hover:border-red-400 hover:text-red-50"
                                    >
                                        {region === "pl" ? "Reset" : "Reset"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {state.status === "idle" && (
                            <div className="flex items-center justify-between rounded-md border border-dashed border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100/80">
                                <span>{region === "pl" ? "Trwa przygotowanie nowej gry..." : "Preparing a new game..."}</span>
                                <Button
                                    onClick={() => handleStart(region)}
                                    disabled={isPending}
                                    className="bg-gradient-to-r from-[#ff1f44] via-[#d1122f] to-[#ff1f44] text-red-50 shadow-[0_0_22px_rgba(255,31,68,0.32)]"
                                >
                                    {region === "pl" ? "Start" : "Start"}
                                </Button>
                            </div>
                        )}

                        {state.message && (
                            <div className="rounded-md border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-100/90">
                                {state.message}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex items-center justify-between border-t border-red-900/30 pt-4 text-xs text-red-200/80">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={isPending}
                            className="border border-red-500/70 bg-red-100/95 text-red-900 shadow-[0_0_12px_rgba(255,31,68,0.15)] hover:border-red-500 hover:text-red-900"
                        >
                            {region === "pl" ? "Resetuj grę" : "Reset game"}
                        </Button>
                        <span>{region === "pl" ? "Silnik: Akinator API" : "Powered by Akinator API"}</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
