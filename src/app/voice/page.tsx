"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceHeader } from "../component/VoiceHeader";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useChat } from "../../hooks/useChat";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { VoiceFloatingBar } from "./components/VoiceFloatingBar";
import { VoiceStage } from "./components/VoiceStage";
import { closeSession } from "../../lib/aiService";

export default function VoiceChatPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { messages, sessionId, language, setLanguage, sendVoiceMessage, isLoading, error } = useChat({ defaultMode: "voice" });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenId, setLastSpokenId] = useState<number | null>(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const goToResult = useCallback(() => {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    router.push(`/interview-summary${query}`);
  }, [router, sessionId]);

  const { supportsVoice, isSpeaking, playAudio, handleStop } = useAudioPlayer();
  const sendVoiceMessageRef = useRef(sendVoiceMessage);
  useEffect(() => { sendVoiceMessageRef.current = sendVoiceMessage; }, [sendVoiceMessage]);
  useEffect(() => { setLanguage(lang === "vi" ? "vietnamese" : "english"); }, [lang, setLanguage]);

  const submitPrompt = useCallback(async (payload: string) => {
    const trimmed = payload.trim();
    if (trimmed) await sendVoiceMessageRef.current(trimmed);
  }, []);

  const { recorderSupported, isRecording, interimTranscript, recognitionError, handleMicToggle } = useVoiceRecognition({ language, onFinalTranscript: submitPrompt });
  const latestVoiceMessage = useMemo(() => [...messages].reverse().find((message) => message.sender === "ai" && message.audioBase64), [messages]);
  const latestQuestion = useMemo(() => [...messages].reverse().find((message) => message.sender === "ai")?.text, [messages]);

  useEffect(() => {
    if (!voiceEnabled || !latestVoiceMessage || latestVoiceMessage.id === lastSpokenId) return;
    const played = playAudio(latestVoiceMessage.audioBase64, latestVoiceMessage.audioMimeType);
    if (played) setLastSpokenId(latestVoiceMessage.id);
  }, [latestVoiceMessage, voiceEnabled, lastSpokenId, playAudio]);

  const handleToggleVoicePlayback = useCallback(() => {
    if (!supportsVoice) return;
    setVoiceEnabled((current) => {
      const next = !current;
      if (!next) handleStop(); else setLastSpokenId(null);
      return next;
    });
  }, [supportsVoice, handleStop]);

  const finishSession = useCallback(async () => {
    try {
      setIsEnding(true);
      if (sessionId) await closeSession(sessionId);
    } catch {
      // A timed-out close request should not block access to results.
    } finally {
      setConfirmEndOpen(false);
      goToResult();
      setIsEnding(false);
    }
  }, [goToResult, sessionId]);

  const waveformActive = isRecording || isSpeaking;
  const requestEndSession = useCallback(() => {
    if (waveformActive) setConfirmEndOpen(true);
    else void finishSession();
  }, [finishSession, waveformActive]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-[#234196]">
      <VoiceHeader voiceEnabled={voiceEnabled} supportsVoice={supportsVoice} onToggleVoicePlayback={handleToggleVoicePlayback} onSubmit={goToResult} onEndSession={requestEndSession} busy={isEnding} />
      {error && <div className="mx-4 mt-3 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm font-semibold text-[#D32F2F]" role="alert">{t(error)}</div>}
      <main className="flex min-h-0 flex-1">
        <VoiceStage
          waveformActive={waveformActive}
          interimTranscript={interimTranscript}
          recognitionError={recognitionError}
          isRecording={isRecording}
          isProcessing={isLoading && !isRecording && !isSpeaking}
          aiActive={isSpeaking}
          candidateActive={isRecording}
          onBargeIn={handleStop}
          question={latestQuestion}
          controls={<VoiceFloatingBar recorderSupported={recorderSupported} isRecording={isRecording} onMicToggle={handleMicToggle} onEndSession={requestEndSession} />}
        />
      </main>

      {confirmEndOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#234196]/35 px-4" role="dialog" aria-modal="true">
          <div className="storybook-card w-full max-w-md bg-[#FEF9EE] p-6">
            <span className="sticker -rotate-1 bg-[#FCB625]">Xác nhận nộp bài</span>
            <h2 className="mt-5 text-3xl">Kết thúc phiên luyện?</h2>
            <p className="mt-3 text-sm leading-6 text-[#5A6B8F]">Bài trả lời sẽ được khóa và chuyển sang phần đánh giá chi tiết.</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" disabled={isEnding} onClick={() => setConfirmEndOpen(false)} className="chunky-secondary px-4 py-2.5 text-sm">Luyện tiếp</button>
              <button type="button" disabled={isEnding} onClick={() => void finishSession()} className="chunky-primary px-4 py-2.5 text-sm">{isEnding ? "Đang nộp…" : "Kết thúc & nộp bài"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
