"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Sidebar } from "../component/Sidebar";
import { VoiceHeader } from "../component/VoiceHeader";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useChat } from "../../hooks/useChat";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { formatRelativeTime } from "../../utils/chatSessionMeta";
import { VoiceFloatingBar } from "./components/VoiceFloatingBar";
import { VoiceLiveTranscript } from "./components/VoiceLiveTranscript";
import { VoiceStage } from "./components/VoiceStage";

function sessionLabel(t: (key: string) => string, index: number) {
  return t("chatInterview.sessionNumber").replace("{n}", String(index + 1));
}

export default function VoiceChatPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const {
    messages,
    sessionId,
    sessionListItems,
    language,
    setLanguage,
    startNewSession,
    loadSession,
    sendVoiceMessage,
    isLoading,
    error,
  } = useChat();

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenId, setLastSpokenId] = useState<number | null>(null);

  const {
    supportsVoice,
    isSpeaking,
    playAudio,
    handleStop,
  } = useAudioPlayer();

  const sendVoiceMessageRef = useRef(sendVoiceMessage);
  useEffect(() => {
    sendVoiceMessageRef.current = sendVoiceMessage;
  }, [sendVoiceMessage]);

  useEffect(() => {
    setLanguage(lang === "vi" ? "vietnamese" : "english");
  }, [lang, setLanguage]);

  const submitPrompt = useCallback(async (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) return;
    await sendVoiceMessageRef.current(trimmed);
  }, []);

  const {
    recorderSupported,
    isRecording,
    interimTranscript,
    recognitionError,
    handleMicToggle,
  } = useVoiceRecognition({ language, onFinalTranscript: submitPrompt });

  const latestVoiceMessage = useMemo(
    () => [...messages].reverse().find((m) => m.sender === "ai" && m.audioBase64),
    [messages]
  );

  useEffect(() => {
    if (!voiceEnabled || !latestVoiceMessage) return;
    if (latestVoiceMessage.id === lastSpokenId) return;
    const played = playAudio(
      latestVoiceMessage.audioBase64,
      latestVoiceMessage.audioMimeType
    );
    if (played) setLastSpokenId(latestVoiceMessage.id);
  }, [latestVoiceMessage, voiceEnabled, lastSpokenId, playAudio]);

  const handleToggleVoicePlayback = useCallback(() => {
    if (!supportsVoice) return;
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) handleStop();
      else setLastSpokenId(null);
      return next;
    });
  }, [supportsVoice, handleStop]);

  const waveformActive = isRecording || isSpeaking;

  return (
    <div className="flex h-screen bg-surface font-body text-on-surface overflow-hidden">
      <Sidebar
        sessionListItems={sessionListItems}
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewSession={() => startNewSession(language)}
      />

      <main className="flex-1 md:ml-[17.5rem] flex flex-col h-full min-w-0 bg-gradient-to-br from-primary/[0.04] via-surface to-tertiary/[0.06] pb-24 md:pb-0">
        <VoiceHeader
          voiceEnabled={voiceEnabled}
          supportsVoice={supportsVoice}
          onToggleVoicePlayback={handleToggleVoicePlayback}
        />

        {error && (
          <div
            className="shrink-0 mx-3 mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-error/25 bg-error-container px-3 py-2.5 text-sm text-on-error-container sm:mx-4"
            role="alert"
          >
            <span className="min-w-0 flex-1">{t(error)}</span>
            <button
              type="button"
              onClick={() => startNewSession(language)}
              className="shrink-0 rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-on-error hover:opacity-95"
            >
              {t("chat.error.retry")}
            </button>
          </div>
        )}

        <div
          id="voice-interview-sessions"
          className="md:hidden border-b border-outline-variant/20 bg-surface-container-low/90 px-4 py-3 backdrop-blur-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            {t("chatInterview.mobileSessions")}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sessionListItems.length === 0 && (
              <span className="text-xs text-on-surface-variant italic whitespace-nowrap">
                {t("chat.noHistoryYet")}
              </span>
            )}
            {sessionListItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadSession(item.id)}
                className={`shrink-0 px-3 py-2 rounded-xl text-left text-xs max-w-[220px] transition-all ${
                  item.id === sessionId
                    ? "bg-primary text-on-primary font-semibold shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <div className="font-semibold truncate">{sessionLabel(t, index)}</div>
                {item.preview && (
                  <div className="truncate opacity-90 mt-0.5 line-clamp-2">{item.preview}</div>
                )}
                <div className="text-[10px] opacity-75 mt-0.5 font-mono">
                  {item.updatedAt > 0
                    ? formatRelativeTime(item.updatedAt, lang === "vi" ? "vi" : "en")
                    : item.id.slice(0, 8)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-2 py-3 sm:px-4 sm:py-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-0 lg:rounded-3xl lg:border lg:border-outline-variant/25 lg:bg-surface-container-lowest/90 lg:shadow-[0_16px_56px_-20px_rgba(86,0,190,0.12)] lg:overflow-hidden">
            {/* Main stage ~2/3 */}
            <div className="relative flex min-h-[min(52vh,480px)] flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-[#f4f6f8] pb-28 lg:min-h-0 lg:rounded-none lg:border-0 lg:bg-[#f4f6f8]">
              <VoiceStage
                waveformActive={waveformActive}
                interimTranscript={interimTranscript}
                recognitionError={recognitionError}
                isRecording={isRecording}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3 sm:bottom-5">
                <VoiceFloatingBar
                  recorderSupported={recorderSupported}
                  isRecording={isRecording}
                  onMicToggle={handleMicToggle}
                  onEndSession={() => router.push("/dashboard")}
                />
              </div>
            </div>

            {/* Live transcript ~1/3 */}
            <div className="flex min-h-[min(42vh,380px)] flex-1 flex-col lg:min-h-0 lg:max-w-[440px] lg:flex-[0.42] xl:max-w-[460px]">
              <VoiceLiveTranscript messages={messages} sessionId={sessionId} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>

      <nav
        className="fixed bottom-5 left-1/2 z-50 flex w-fit min-w-[160px] -translate-x-1/2 items-center justify-center gap-8 rounded-full border border-white/10 bg-primary/95 px-6 py-2 shadow-lg backdrop-blur-xl md:hidden"
        aria-label={t("chatInterview.navSection")}
      >
        <Link
          href="/chat"
          className="rounded-full p-2 text-on-primary/95 transition-transform hover:bg-white/10 active:scale-95"
          aria-label={t("chatInterview.nav.chatInterview")}
        >
          <span className="material-symbols-outlined text-[22px]">chat</span>
        </Link>
        <a
          href="#voice-interview-sessions"
          className="rounded-full p-2 text-on-primary/95 transition-transform hover:bg-white/10 active:scale-95"
          aria-label={t("chat.history")}
        >
          <span className="material-symbols-outlined text-[22px]">history</span>
        </a>
      </nav>
    </div>
  );
}
