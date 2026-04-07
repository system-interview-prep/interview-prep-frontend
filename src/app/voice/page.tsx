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
import { VoiceHeader } from "../component/VoiceHeader";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useChat } from "../../hooks/useChat";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { VoiceFloatingBar } from "./components/VoiceFloatingBar";
import { VoiceLiveTranscript } from "./components/VoiceLiveTranscript";
import { VoiceStage } from "./components/VoiceStage";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { closeSession } from "../../lib/aiService";

export default function VoiceChatPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { width: transcriptWidth, startResize: startTranscriptResize } = useResizableWidth({
    storageKey: "voice.transcriptWidth.v1",
    defaultWidth: 430,
    minWidth: 320,
    maxWidth: 640,
  });
  const {
    messages,
    sessionId,
    language,
    setLanguage,
    sendVoiceMessage,
    isLoading,
    error,
  } = useChat({ defaultMode: "voice" });

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenId, setLastSpokenId] = useState<number | null>(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

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
    <div
      className="flex h-screen bg-surface font-body text-on-surface overflow-hidden"
      style={{
        ["--transcript-width" as any]: `${transcriptWidth}px`,
      } as React.CSSProperties}
    >
      <main className="flex-1 flex flex-col h-full min-w-0 bg-gradient-to-br from-primary/[0.04] via-surface to-tertiary/[0.06] pb-24 md:pb-0">
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
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col px-2 py-3 sm:px-4 sm:py-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_12px_var(--transcript-width)] lg:gap-0 lg:rounded-3xl lg:border lg:border-outline-variant/25 lg:bg-surface-container-lowest/90 lg:shadow-[0_16px_56px_-20px_rgba(86,0,190,0.12)] lg:overflow-hidden">
            {/* Main stage ~2/3 */}
            <div className="relative flex min-h-[min(52vh,480px)] flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-[#f4f6f8] pb-8 lg:col-start-1 lg:min-h-0 lg:min-w-0 lg:rounded-none lg:border-0 lg:bg-[#f4f6f8]">
              <VoiceStage
                waveformActive={waveformActive}
                interimTranscript={interimTranscript}
                recognitionError={recognitionError}
                isRecording={isRecording}
                aiActive={isSpeaking}
                candidateActive={isRecording}
                controls={
                  <VoiceFloatingBar
                    recorderSupported={recorderSupported}
                    isRecording={isRecording}
                    onMicToggle={handleMicToggle}
                    onEndSession={() => setConfirmEndOpen(true)}
                  />
                }
              />
            </div>

            <button
              type="button"
              onPointerDown={startTranscriptResize}
              aria-label="Resize transcript panel"
              title="Resize transcript panel"
              className="hidden lg:flex lg:col-start-2 w-3 shrink-0 cursor-col-resize items-stretch justify-center border-0 bg-transparent p-0 outline-none"
            >
              <span className="my-4 w-px rounded-full bg-outline-variant/25 transition-colors hover:bg-primary/50" />
            </button>

            {/* Live transcript ~1/3 */}
            <div
              className="flex min-h-[min(42vh,380px)] flex-1 flex-col lg:col-start-3 lg:min-h-0 lg:min-w-0"
            >
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
      </nav>

      {confirmEndOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xl">
            <div className="mb-3">
              <div className="text-base font-semibold text-on-surface">
                {t("chatInterview.endSession")}
              </div>
              <div className="mt-1 text-sm text-on-surface-variant">
                Bạn có chắc muốn kết thúc phiên này không?
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isEnding}
                onClick={() => setConfirmEndOpen(false)}
                className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-all"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={isEnding}
                onClick={async () => {
                  try {
                    setIsEnding(true);
                    if (sessionId) await closeSession(sessionId);
                  } catch {
                    // ignore
                  } finally {
                    setConfirmEndOpen(false);
                    router.push("/dashboard");
                    setIsEnding(false);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {isEnding ? "Closing…" : "Kết thúc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
