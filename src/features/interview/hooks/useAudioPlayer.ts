"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayer() {
    const [supportsVoice, setSupportsVoice] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const hasAudio = typeof Audio !== "undefined";
        setSupportsVoice(hasAudio);
        if (!hasAudio) return;

        const audio = new Audio();
        audioRef.current = audio;

        const handlePlay = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };
        const handlePause = () => {
            setIsSpeaking(false);
            setIsPaused(true);
        };
        const handleEnded = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }
            audioRef.current = null;
        };
    }, []);

    const playAudio = useCallback(
        (audioBase64?: string, mimeType?: string): boolean => {
            if (!supportsVoice || !audioRef.current || !audioBase64) return false;

            try {
                const byteCharacters = atob(audioBase64);
                const byteArray = new Uint8Array(byteCharacters.length);
                for (let index = 0; index < byteCharacters.length; index += 1) {
                    byteArray[index] = byteCharacters.charCodeAt(index);
                }

                const blob = new Blob([byteArray], { type: mimeType || "audio/mpeg" });
                const objectUrl = URL.createObjectURL(blob);

                const audio = audioRef.current;
                audio.pause();
                audio.currentTime = 0;
                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current);
                }
                audioUrlRef.current = objectUrl;
                audio.src = objectUrl;

                const playPromise = audio.play();
                if (playPromise instanceof Promise) {
                    playPromise.catch(() => {
                        setIsPaused(true);
                        setIsSpeaking(false);
                    });
                }
                return true;
            } catch (err) {
                console.error("Failed to play audio clip", err);
                return false;
            }
        },
        [supportsVoice]
    );

    const handlePause = useCallback(() => {
        if (!supportsVoice || !audioRef.current) return;
        audioRef.current.pause();
    }, [supportsVoice]);

    const handleResume = useCallback(() => {
        if (!supportsVoice || !audioRef.current) return;
        audioRef.current.play().catch(() => {
            setIsPaused(true);
        });
    }, [supportsVoice]);

    const handleStop = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPaused(false);
        setIsSpeaking(false);
    }, []);

    return {
        supportsVoice,
        isSpeaking,
        isPaused,
        playAudio,
        handlePause,
        handleResume,
        handleStop,
    };
}
