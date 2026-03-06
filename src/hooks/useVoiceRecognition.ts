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
    const [recognitionError, setRecognitionError] = useState<string | null>(null);

    const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
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
        recognition.continuous = false;
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
                onFinalTranscriptRef.current(finalText);
            }
        };

        recognition.onerror = (event: VoiceRecognitionErrorEvent) => {
            const message =
                event.error === "not-allowed"
                    ? language === "vietnamese"
                        ? "Trình duyệt không được cấp quyền microphone."
                        : "Microphone permission is blocked."
                    : event.message || event.error;
            setRecognitionError(message);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            setInterimTranscript("");
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.stop();
            recognitionRef.current = null;
        };
    }, [language]);

    const handleStartRecording = useCallback(() => {
        if (!recorderSupported || !recognitionRef.current || isRecording) return;
        setRecognitionError(null);
        setInterimTranscript("");
        try {
            recognitionRef.current.lang = language === "vietnamese" ? "vi-VN" : "en-US";
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Speech recognition failed to start", err);
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
        recognitionRef.current.stop();
    }, []);

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
        recognitionError,
        handleMicToggle,
        handleStartRecording,
        handleStopRecording,
    };
}
