'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, CameraOff, Mic, MicOff, PhoneOff, VideoOff } from 'lucide-react';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { interviewChatApi } from '../services/interviewChat.service';
import { chatErrorMessage, ErrorBanner } from './ChatRoomParts';
import {
  AI_ICON,
  ControlButton,
  PreJoinCard,
  SpeakerOrb,
  StatusPill,
  TranscriptPanel,
  USER_ICON,
  VoiceActivityBars,
  VoiceRoomHeader,
  voiceStatus,
} from './VoiceRoomParts';

export default function LiveKitInterviewRoom({
  sessionId,
  mode,
  jobTitle,
  backUrl = '/interview/select',
}: {
  sessionId: string;
  mode: 'voice' | 'video';
  jobTitle?: string;
  backUrl?: string;
}) {
  const router = useRouter();
  const {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    localVideoRef,
    remoteAudioContainerRef,
    transcript,
    status,
    isConnected,
    isAgentConnected,
    isAgentSpeaking,
    isUserSpeaking,
    micEnabled,
    cameraEnabled,
    error: livekitError,
    terminalEvent,
  } = useLiveKitRoom({ sessionId, cameraOnStart: mode === 'video' });
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  const currentStatus = useMemo(
    () => voiceStatus(status, isAgentConnected),
    [isAgentConnected, status],
  );

  useEffect(() => {
    if (!terminalEvent) return;
    let active = true;
    void disconnect().finally(() => {
      if (active) router.replace(`/interview/results/${encodeURIComponent(sessionId)}`);
    });
    return () => { active = false; };
  }, [disconnect, router, sessionId, terminalEvent]);

  const endRoom = async () => {
    if (isEnding) return;
    setIsEnding(true);
    setEndError(null);
    try {
      await interviewChatApi.complete(sessionId, 'USER_ENDED');
    } catch (error) {
      setShowEndModal(false);
      setEndError(
        `Chưa kết thúc được buổi phỏng vấn: ${chatErrorMessage(error, 'vui lòng thử lại.')}`,
      );
      setIsEnding(false);
      return;
    }
    await disconnect().catch(() => undefined);
    router.push(`/interview/results/${encodeURIComponent(sessionId)}`);
  };

  const leaveRoom = () => {
    void disconnect()
      .catch(() => undefined)
      .finally(() => router.push(backUrl));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
      <VoiceRoomHeader
        mode={mode}
        jobTitle={jobTitle}
        status={currentStatus}
        isEnding={isEnding}
        onBack={leaveRoom}
        onEnd={() => setShowEndModal(true)}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:p-4">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,_#2B4FA8_0%,_#1C3270_45%,_#14244B_100%)] p-5 pb-24 shadow-sm">
          <div className="absolute left-4 top-4 z-[5]">
            <StatusPill label={currentStatus.label} tone={currentStatus.tone} onDark />
          </div>

          {mode === 'video' ? (
            <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex min-h-56 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                <SpeakerOrb label="AI Interviewer" role="ai" active={isAgentSpeaking} icon={AI_ICON} />
              </div>
              <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/30">
                {/* Keep the <video> mounted: useLiveKitRoom attaches the local track to it. */}
                <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                {!cameraEnabled ? (
                  <div className="relative flex flex-col items-center gap-2 text-white/70">
                    <VideoOff className="size-8" aria-hidden="true" />
                    <span className="text-xs font-semibold">Camera đang tắt</span>
                  </div>
                ) : null}
                <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Bạn{isUserSpeaking ? ' · đang nói' : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
              <SpeakerOrb label="AI Interviewer" role="ai" active={isAgentSpeaking} icon={AI_ICON} />
              <VoiceActivityBars agentSpeaking={isAgentSpeaking} userSpeaking={isUserSpeaking} />
              <SpeakerOrb label="Bạn" role="user" active={isUserSpeaking} icon={USER_ICON} />
            </div>
          )}

          {isConnected ? (
            <div
              role="toolbar"
              aria-label="Điều khiển cuộc gọi"
              className="absolute bottom-4 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#14244B]/90 p-2 shadow-2xl backdrop-blur-xl"
            >
              <ControlButton
                label={micEnabled ? 'Tắt micro' : 'Bật micro'}
                onClick={() => void toggleMic()}
                active={micEnabled}
                icon={micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              />
              {mode === 'video' ? (
                <ControlButton
                  label={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
                  onClick={() => void toggleCamera()}
                  active={cameraEnabled}
                  icon={cameraEnabled ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
                />
              ) : null}
              <ControlButton
                label="Kết thúc phỏng vấn"
                onClick={() => setShowEndModal(true)}
                disabled={isEnding}
                active={false}
                danger
                icon={<PhoneOff className="size-5" />}
              />
            </div>
          ) : null}

          {!isConnected && status !== 'ended' ? (
            <PreJoinCard mode={mode} status={status} error={livekitError} onConnect={() => void connect()} />
          ) : null}
        </section>

        <TranscriptPanel
          lines={transcript}
          agentConnected={isAgentConnected}
          footer={
            <>
              {livekitError && isConnected ? (
                <p role="alert" className="m-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{livekitError}</span>
                </p>
              ) : null}
              {endError ? (
                <div className="m-3">
                  <ErrorBanner message={endError} onDismiss={() => setEndError(null)} />
                </div>
              ) : null}
            </>
          }
        />
      </main>

      {/* Remote audio plays through this container: it must stay mounted. */}
      <div ref={remoteAudioContainerRef} className="hidden" aria-hidden="true" />

      <AbortConfirmationModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={() => void endRoom()}
        isSubmitting={isEnding}
      />
    </div>
  );
}
