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

type InterviewMode = "chat" | "voice";

type UseChatOptions = {
    defaultMode?: InterviewMode;
};

export type ChatSessionListItem = {
    id: string;
    preview: string;
    updatedAt: number;
    messageCount: number;
};

/** API/localStorage may yield numeric ids; normalize so callers can use string methods safely. */
function normalizeSessionId(raw: unknown): string {
    if (raw == null) return "";
    const s = String(raw).trim();
    return s === "undefined" || s === "null" ? "" : s;
}

function getDemoSessionTopic(mode: InterviewMode, language: string): string {
    if (mode === "voice") {
        return language === "vietnamese" ? "Gọi thoại AI" : "AI Voice Call";
    }
    return language === "vietnamese" ? "Phỏng vấn chat AI" : "AI Chat Interview";
}

function recordDemoSession(roomId: string, topic: string, mode: InterviewMode) {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem("demo.sessions");
        const prev = raw ? (JSON.parse(raw) as Array<{ roomId: string; topic: string; startedAt: string; mode?: string }>) : [];
        const next = [
            { roomId, topic, startedAt: new Date().toISOString(), mode },
            ...prev.filter((item) => item.roomId !== roomId),
        ].slice(0, 50);
        localStorage.setItem("demo.sessions", JSON.stringify(next));
    } catch {
        /* ignore */
    }
}

export function useChat(options: UseChatOptions = {}) {
    const defaultMode = options.defaultMode ?? "chat";
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
            const list = Array.isArray(all.sessions) ? all.sessions : [];
            setSessions(
                list.map(normalizeSessionId).filter((id) => id.length > 0),
            );
            setSessionMeta(readAllSessionMeta());
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    }, []);

    const loadSession = useCallback(
        async (sid: string) => {
            const sessionKey = normalizeSessionId(sid);
            if (!sessionKey) return;
            try {
                setIsLoading(true);
                setError(null);
                setSessionId(sessionKey);
                const historyRes = await getChatHistory(sessionKey);
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
                    // Opening + Q1 are persisted by BE on GET /ai/history when a plan exists (ensureOpeningIfEmpty).
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
                syncMetaFromMessages(sessionKey, nextMessages);
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
                const nextLanguage = lang ?? language;
                const res = await createSession({
                    type: defaultMode === "voice" ? "Voice" : "Chat",
                    language: nextLanguage === "vietnamese" ? "Vietnamese" : "English",
                });
                if (lang) setLanguage(lang);
                recordDemoSession(res.sessionId, getDemoSessionTopic(defaultMode, nextLanguage), defaultMode);
                await loadSession(res.sessionId);
                await fetchSessions();
            } catch (err) {
                setError("chat.error.createSession");
                setIsLoading(false);
            }
        },
        [defaultMode, fetchSessions, language, loadSession]
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

                // BE will persist both: assistant reply + next question (if any).
                // So after sending, reload history and render it as the single source of truth.
                await sendChatMessage({ sessionId, prompt: input, language });
                const historyRes = await getChatHistory(sessionId);
                const nextMessages: Message[] = (historyRes.history || []).map((item, idx) => {
                    const parsed = Date.parse(item.timestamp);
                    return {
                        id: idx + 1,
                        text: item.content,
                        sender: item.role === "assistant" ? ("ai" as const) : ("user" as const),
                        sentAt: Number.isFinite(parsed) ? parsed : undefined,
                    };
                });
                if (nextMessages.length > 0) {
                    setMessages(nextMessages);
                    syncMetaFromMessages(sessionId, nextMessages);
                    setSessionMeta(readAllSessionMeta());
                }
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
        // If a session was created before navigation (e.g. generate questions step),
        // reuse it instead of creating a new one.
        if (typeof window !== "undefined") {
            try {
                const pre = sessionStorage.getItem("interview.preSessionId");
                if (pre && pre.trim()) {
                    sessionStorage.removeItem("interview.preSessionId");
                    void loadSession(pre.trim());
                    void fetchSessions();
                    return;
                }
            } catch {
                /* ignore */
            }
        }
        startNewSession();
    }, [startNewSession, loadSession, fetchSessions]);

    const sessionListItems: ChatSessionListItem[] = useMemo(() => {
        return [...sessions]
            .map((id) => {
                const sid = normalizeSessionId(id);
                return {
                    id: sid,
                    preview: sessionMeta[sid]?.preview ?? "",
                    updatedAt: sessionMeta[sid]?.updatedAt ?? 0,
                    messageCount: sessionMeta[sid]?.messageCount ?? 0,
                };
            })
            .filter((item) => item.id.length > 0)
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
