"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "../../hooks/useChat";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { Message } from "../../types/message";
import { MessageBubble } from "./components/MessageBubble";
import { VoicePageHeader } from "./components/VoicePageHeader";
import { VoiceChatInput } from "./components/VoiceChatInput";
import { VoiceConsole } from "./components/VoiceConsole";

export default function VoiceChatPage() {
  const {
    messages,
    sessionId,
    sessions,
    language,
    setLanguage,
    startNewSession,
    loadSession,
    sendVoiceMessage,
    isLoading,
    error,
  } = useChat();

  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenId, setLastSpokenId] = useState<number | null>(null);

  const {
    supportsVoice,
    isSpeaking,
    playAudio,
    handleStop,
  } = useAudioPlayer();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sendVoiceMessageRef = useRef(sendVoiceMessage);
  useEffect(() => {
    sendVoiceMessageRef.current = sendVoiceMessage;
  }, [sendVoiceMessage]);

  const submitPrompt = useCallback(async (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) return;
    setInput("");
    await sendVoiceMessageRef.current(trimmed);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const {
    recorderSupported,
    isRecording,
    interimTranscript,
    recognitionError,
    handleMicToggle,
  } = useVoiceRecognition({ language, onFinalTranscript: submitPrompt });

  const latestAiMessage = useMemo(
    () => [...messages].reverse().find((m) => m.sender === "ai"),
    [messages]
  );

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

  const replayVoice = useCallback(
    (message: Message) => {
      if (!message.audioBase64) return;
      const played = playAudio(message.audioBase64, message.audioMimeType);
      if (played) setLastSpokenId(message.id);
    },
    [playAudio]
  );

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content) return;
    await submitPrompt(content);
  }, [input, submitPrompt]);

  const handleToggleVoice = useCallback(() => {
    if (!supportsVoice) return;
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) handleStop();
      else setLastSpokenId(null);
      return next;
    });
  }, [supportsVoice, handleStop]);

  const recentSessions = useMemo(() => sessions.slice(0, 4), [sessions]);

  return (
    <div className="relative h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[60vw] w-[60vw] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[40vw] w-[40vw] rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-4 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-5">
          <VoicePageHeader
            language={language}
            setLanguage={setLanguage}
            voiceEnabled={voiceEnabled}
            supportsVoice={supportsVoice}
            onToggleVoice={handleToggleVoice}
          />

          <div className="grid flex-1 min-h-0 gap-6 overflow-hidden lg:grid-cols-[1.25fr_0.75fr]">
            {/* Main chat section */}
            <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-3xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Session {sessionId ? sessionId.slice(0, 8) : "loading"}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Conversational Arena
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => startNewSession(language)}
                  className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10"
                >
                  New Voice Session
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div className="mt-6 flex-1 min-h-0 overflow-hidden">
                <div className="flex h-full flex-col space-y-4 overflow-y-auto scroll-smooth pr-2">
                  {messages.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-white/20 px-6 py-10 text-center text-sm text-slate-300">
                      Voice session is booting up. Say hi to begin.
                    </div>
                  )}
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isActive={message.id === lastSpokenId}
                      onReplay={replayVoice}
                      canReplay={supportsVoice && Boolean(message.audioBase64)}
                    />
                  ))}
                  {isLoading && (
                    <div className="rounded-3xl border border-white/20 bg-white/5 px-5 py-4 text-sm text-slate-300">
                      AI is composing a spoken response…
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <VoiceChatInput
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onMicToggle={handleMicToggle}
                isRecording={isRecording}
                recorderSupported={recorderSupported}
                interimTranscript={interimTranscript}
                recognitionError={recognitionError}
                language={language}
              />
            </section>

            <VoiceConsole
              supportsVoice={supportsVoice}
              voiceEnabled={voiceEnabled}
              isSpeaking={isSpeaking}
              recorderSupported={recorderSupported}
              isRecording={isRecording}
              language={language}
              latestAiMessage={latestAiMessage}
              recentSessions={recentSessions}
              sessionId={sessionId}
              loadSession={loadSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
