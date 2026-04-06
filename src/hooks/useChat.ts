import { useState, useEffect, useCallback, useMemo } from "react";
import { Message } from "../types/message";
import {
    sendChatMessage,
    getChatHistory,
    createSession,
    getAllSessions,
    sendVoiceChatMessage,
} from "../lib/aiService";
import {
    readAllSessionMeta,
    syncMetaFromMessages,
    type SessionMeta,
} from "../utils/chatSessionMeta";

export type ChatSessionListItem = {
    id: string;
    preview: string;
    updatedAt: number;
    messageCount: number;
};

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [language, setLanguage] = useState<string>("vietnamese");
    const [sessions, setSessions] = useState<string[]>([]);
    const [sessionMeta, setSessionMeta] = useState<Record<string, SessionMeta>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSessionMeta(readAllSessionMeta());
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const all = await getAllSessions();
            setSessions(all.sessions.filter((s) => s && s !== "undefined"));
            setSessionMeta(readAllSessionMeta());
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
                let nextMessages: Message[];
                if (historyRes.history && historyRes.history.length > 0) {
                    nextMessages = historyRes.history.map((item, idx) => {
                        const parsed = Date.parse(item.timestamp);
                        return {
                            id: idx + 1,
                            text: item.content,
                            sender: item.role === "assistant" ? ("ai" as const) : ("user" as const),
                            sentAt: Number.isFinite(parsed) ? parsed : undefined,
                        };
                    });
                } else {
                    nextMessages = [
                        {
                            id: 1,
                            text:
                                language === "vietnamese"
                                    ? "Xin chào! Tôi là AI, bạn cần luyện phỏng vấn lĩnh vực nào?"
                                    : "Hello! I'm AI, which interview topic do you want to practice?",
                            sender: "ai",
                            sentAt: Date.now(),
                        },
                    ];
                }
                setMessages(nextMessages);
                syncMetaFromMessages(sid, nextMessages);
                setSessionMeta(readAllSessionMeta());
            } catch (err) {
                setError("chat.error.loadSession");
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
                setError("chat.error.createSession");
                setIsLoading(false);
            }
        },
        [fetchSessions, loadSession]
    );

    const sendMessageInternal = useCallback(
        async (input: string, mode: "text" | "voice"): Promise<{ audioBase64?: string; audioMimeType?: string } | null> => {
            if (!input.trim() || !sessionId) return null;

            const sentAt = Date.now();
            setMessages((prev) => {
                const next = [
                    ...prev,
                    {
                        id: prev.length + 1,
                        text: input,
                        sender: "user" as const,
                        sentAt,
                    },
                ];
                syncMetaFromMessages(sessionId, next);
                setSessionMeta(readAllSessionMeta());
                return next;
            });
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

                    setMessages((prev) => {
                        const next = [
                            ...prev,
                            {
                                id: prev.length + 1,
                                text: replyText,
                                sender: "ai" as const,
                                sentAt: Date.now(),
                                ...voicePayload,
                            },
                        ];
                        syncMetaFromMessages(sessionId, next);
                        setSessionMeta(readAllSessionMeta());
                        return next;
                    });
                    return voicePayload;
                }

                const data = await sendChatMessage({ sessionId, prompt: input, language });
                const replyText =
                    data.reply ||
                    (language === "vietnamese"
                        ? "Không nhận được phản hồi từ AI."
                        : "No response from AI.");

                setMessages((prev) => {
                    const next = [
                        ...prev,
                        {
                            id: prev.length + 1,
                            text: replyText,
                            sender: "ai" as const,
                            sentAt: Date.now(),
                        },
                    ];
                    syncMetaFromMessages(sessionId, next);
                    setSessionMeta(readAllSessionMeta());
                    return next;
                });
                return null;
            } catch (err) {
                setError("chat.error.sendFailed");
                setMessages((prev) => {
                    const next = [
                        ...prev,
                        {
                            id: prev.length + 1,
                            text:
                                language === "vietnamese"
                                    ? "Lỗi kết nối đến AI."
                                    : "Failed to connect to AI.",
                            sender: "ai" as const,
                            sentAt: Date.now(),
                        },
                    ];
                    syncMetaFromMessages(sessionId, next);
                    setSessionMeta(readAllSessionMeta());
                    return next;
                });
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
        startNewSession();
    }, []);

    const sessionListItems: ChatSessionListItem[] = useMemo(() => {
        return [...sessions]
            .map((id) => ({
                id,
                preview: sessionMeta[id]?.preview ?? "",
                updatedAt: sessionMeta[id]?.updatedAt ?? 0,
                messageCount: sessionMeta[id]?.messageCount ?? 0,
            }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [sessions, sessionMeta]);

    return {
        messages,
        sessionId,
        language,
        sessions,
        sessionListItems,
        isLoading,
        error,
        setLanguage,
        startNewSession,
        loadSession,
        sendMessage,
        sendVoiceMessage,
    };
}
