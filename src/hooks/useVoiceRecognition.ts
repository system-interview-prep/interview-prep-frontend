"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    VoiceRecognitionConstructor,
    VoiceRecognitionErrorEvent,
    VoiceRecognitionInstance,
    VoiceRecognitionResultEvent,
} from "../types/voiceRecognition";

type UseVoiceRecognitionOptions = {
    language: string;
    onFinalTranscript: (text: string) => void;
};

export function useVoiceRecognition({
    language,
    onFinalTranscript,
}: UseVoiceRecognitionOptions) {
    const [recorderSupported, setRecorderSupported] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    /** Each finalized phrase (after a natural pause / end of utterance). Capped for UI memory. */
    const [committedSegments, setCommittedSegments] = useState<string[]>([]);
    const [recognitionError, setRecognitionError] = useState<string | null>(null);

    const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
    /** True while user wants mic on — only cleared when they press Stop (not on browser pause/end). */
    const userWantsListeningRef = useRef(false);
    const onFinalTranscriptRef = useRef(onFinalTranscript);

    useEffect(() => {
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onFinalTranscript]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const extendedWindow = window as typeof window & {
            SpeechRecognition?: VoiceRecognitionConstructor;
            webkitSpeechRecognition?: VoiceRecognitionConstructor;
        };

        const RecognitionClass =
            extendedWindow.SpeechRecognition || extendedWindow.webkitSpeechRecognition;

        if (!RecognitionClass) {
            setRecorderSupported(false);
            recognitionRef.current = null;
            return;
        }

        setRecorderSupported(true);
        const recognition = new RecognitionClass();
        recognition.lang = language === "vietnamese" ? "vi-VN" : "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event: VoiceRecognitionResultEvent) => {
            const results = Array.from(event.results ?? []);
            const startIndex = event.resultIndex ?? 0;
            let interimText = "";
            let finalText = "";

            for (let index = startIndex; index < results.length; index += 1) {
                const result = results[index];
                if (!result || result.length === 0) continue;
                const transcript = result[0]?.transcript?.trim();
                if (!transcript) continue;
                if (result.isFinal) {
                    finalText = `${finalText} ${transcript}`.trim();
                } else {
                    interimText = `${interimText} ${transcript}`.trim();
                }
            }

            setInterimTranscript(interimText);

            if (finalText) {
                setInterimTranscript("");
                setRecognitionError(null);
                setCommittedSegments((prev) => {
                    const next = [...prev, finalText];
                    return next.length > 40 ? next.slice(-40) : next;
                });
                onFinalTranscriptRef.current(finalText);
            }
        };

        recognition.onerror = (event: VoiceRecognitionErrorEvent) => {
            if (event.error === "no-speech" || event.error === "audio-capture") {
                return;
            }
            if (event.error === "aborted") {
                return;
            }
            const message =
                event.error === "not-allowed"
                    ? language === "vietnamese"
                        ? "Trình duyệt không được cấp quyền microphone."
                        : "Microphone permission is blocked."
                    : event.message || event.error;
            setRecognitionError(message);
            userWantsListeningRef.current = false;
            setIsRecording(false);
        };

        recognition.onend = () => {
            if (!userWantsListeningRef.current) {
                setIsRecording(false);
                setInterimTranscript("");
                setCommittedSegments([]);
                return;
            }
            window.setTimeout(() => {
                if (!userWantsListeningRef.current || !recognitionRef.current) return;
                try {
                    recognitionRef.current.start();
                } catch {
                    /* InvalidStateError: session already started */
                }
            }, 0);
        };

        recognitionRef.current = recognition;

        return () => {
            userWantsListeningRef.current = false;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try {
                recognition.stop();
            } catch {
                /* ignore */
            }
            recognitionRef.current = null;
        };
    }, [language]);

    const handleStartRecording = useCallback(() => {
        if (!recorderSupported || !recognitionRef.current) return;
        if (isRecording) return;
        setRecognitionError(null);
        setInterimTranscript("");
        setCommittedSegments([]);
        userWantsListeningRef.current = true;
        try {
            recognitionRef.current.lang = language === "vietnamese" ? "vi-VN" : "en-US";
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Speech recognition failed to start", err);
            userWantsListeningRef.current = false;
            setRecognitionError(
                language === "vietnamese"
                    ? "Không thể bắt đầu thu giọng nói."
                    : "Unable to start voice capture."
            );
            setIsRecording(false);
        }
    }, [recorderSupported, isRecording, language]);

    const handleStopRecording = useCallback(() => {
        if (!recognitionRef.current) return;
        userWantsListeningRef.current = false;
        try {
            recognitionRef.current.stop();
        } catch {
            /* ignore */
        }
    }, []);

    /** Toggle start/stop — for screens where mic should turn off without ending the session (e.g. Voice page). */
    const handleMicToggle = useCallback(() => {
        if (!recorderSupported) return;
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    }, [recorderSupported, isRecording, handleStartRecording, handleStopRecording]);

    return {
        recorderSupported,
        isRecording,
        interimTranscript,
        committedSegments,
        recognitionError,
        handleMicToggle,
        handleStartRecording,
        handleStopRecording,
    };
}
