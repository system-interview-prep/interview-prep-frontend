import { useState, useEffect, useCallback } from "react";
import { Message } from "../types/message";
import {
    sendChatMessage,
    getChatHistory,
    createSession,
    getAllSessions,
    sendVoiceChatMessage,
} from "../lib/aiService";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [language, setLanguage] = useState<string>("vietnamese");
    const [sessions, setSessions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        try {
            const all = await getAllSessions();
            setSessions(all.sessions.filter((s) => s && s !== "undefined"));
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    }, []);

    const loadSession = useCallback(
        async (sid: string) => {
            try {
                setIsLoading(true);
                setError(null);
                setSessionId(sid);
                const historyRes = await getChatHistory(sid);
                if (historyRes.history && historyRes.history.length > 0) {
                    setMessages(
                        historyRes.history.map((item, idx) => ({
                            id: idx + 1,
                            text: item.content,
                            sender: item.role === "assistant" ? "ai" : "user",
                        }))
                    );
                } else {
                    setMessages([
                        {
                            id: 1,
                            text:
                                language === "vietnamese"
                                    ? "Xin chào! Tôi là AI, bạn cần luyện phỏng vấn lĩnh vực nào?"
                                    : "Hello! I'm AI, which interview topic do you want to practice?",
                            sender: "ai",
                        },
                    ]);
                }
            } catch (err) {
                setError("Failed to load session history");
            } finally {
                setIsLoading(false);
            }
        },
        [language]
    );

    const startNewSession = useCallback(
        async (lang?: string) => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await createSession();
                if (lang) setLanguage(lang);
                await loadSession(res.sessionId);
                await fetchSessions();
            } catch (err) {
                setError("Failed to create new session");
                setIsLoading(false);
            }
        },
        [fetchSessions, loadSession]
    );

    const sendMessageInternal = useCallback(
        async (
            input: string,
            mode: "text" | "voice"
        ): Promise<{ audioBase64?: string; audioMimeType?: string } | null> => {
            if (!input.trim() || !sessionId) return null;

            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length + 1,
                    text: input,
                    sender: "user",
                },
            ]);
            setIsLoading(true);
            setError(null);

            try {
                if (mode === "voice") {
                    const data = await sendVoiceChatMessage({ sessionId, prompt: input, language });
                    const replyText =
                        data.reply ||
                        (language === "vietnamese"
                            ? "Không nhận được phản hồi từ AI."
                            : "No response from AI.");
                    const voicePayload = {
                        audioBase64: data.audioBase64,
                        audioMimeType: data.mimeType,
                    };

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: prev.length + 1,
                            text: replyText,
                            sender: "ai",
                            ...voicePayload,
                        },
                    ]);
                    return voicePayload;
                }

                const data = await sendChatMessage({ sessionId, prompt: input, language });
                const replyText =
                    data.reply ||
                    (language === "vietnamese"
                        ? "Không nhận được phản hồi từ AI."
                        : "No response from AI.");

                setMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        text: replyText,
                        sender: "ai",
                    },
                ]);
                return null;
            } catch (err) {
                setError("Failed to send message");
                setMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        text:
                            language === "vietnamese"
                                ? "Lỗi kết nối đến AI."
                                : "Failed to connect to AI.",
                        sender: "ai",
                    },
                ]);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [language, sessionId]
    );

    const sendMessage = async (input: string) => {
        await sendMessageInternal(input, "text");
    };

    const sendVoiceMessage = async (input: string) => {
        return sendMessageInternal(input, "voice");
    };

    useEffect(() => {
        // Initial load
        startNewSession();
    }, []);

    return {
        messages,
        sessionId,
        language,
        sessions,
        isLoading,
        error,
        setLanguage,
        startNewSession,
        loadSession,
        sendMessage,
        sendVoiceMessage,
    };
}
