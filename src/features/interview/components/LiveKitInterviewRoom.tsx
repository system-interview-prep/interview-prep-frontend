'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, CameraOff, Mic, MicOff, PhoneOff, Repeat, VideoOff } from 'lucide-react';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';
import { ConfirmDialog } from '@components/shared/ConfirmDialog';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { useRuntimeProgress } from '../hooks/useRuntimeProgress';
import { ChatStageStepper } from './ChatInterviewProgress';
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
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';

export default function LiveKitInterviewRoom({
  sessionId,
  mode,
  locale,
  jobTitle,
  backUrl = '/interview/select',
}: {
  sessionId: string;
  mode: 'voice' | 'video';
  locale: string;
  jobTitle?: string;
  backUrl?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    sendAnswerCommand,
    localVideoRef,
    remoteAudioContainerRef,
    transcript,
    interimTranscript,
    status,
    isConnected,
    isAgentConnected,
    isAgentSpeaking,
    isUserSpeaking,
    micEnabled,
    cameraEnabled,
    error: livekitError,
    terminalEvent,
    turnState,
  } = useLiveKitRoom({ sessionId, locale, cameraOnStart: mode === 'video' });
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Re-read question number / stage / timer whenever the transcript grows.
  const progress = useRuntimeProgress(sessionId, transcript.length + (terminalEvent ? 1 : 0));

  const currentStatus = useMemo(
    () => voiceStatus(status, isAgentConnected, t, turnState),
    [isAgentConnected, status, t, turnState],
  );

  useEffect(() => {
    if (!terminalEvent) return;
    let active = true;
    void disconnect().finally(() => {
      if (active) router.replace(`/interview/results/${encodeURIComponent(sessionId)}`);
    });
    return () => { active = false; };
  }, [disconnect, router, sessionId, terminalEvent]);

  useEffect(() => {
    // The data packet is reliable, but the candidate can still reconnect or
    // close the tab before receiving it. The persisted runtime is the source
    // of truth, so never leave a completed media session stranded in-room.
    if (!progress?.isClosed || terminalEvent) return;
    let active = true;
    void disconnect().finally(() => {
      if (active) router.replace(`/interview/results/${encodeURIComponent(sessionId)}`);
    });
    return () => { active = false; };
  }, [disconnect, progress?.isClosed, router, sessionId, terminalEvent]);

  const endRoom = async (reason: 'USER_ENDED' | 'TECHNICAL_FAILURE' = 'USER_ENDED') => {
    if (isEnding) return;
    setIsEnding(true);
    setEndError(null);
    try {
      await interviewChatApi.complete(sessionId, reason);
    } catch (error) {
      setShowEndModal(false);
      setEndError(
        fmt(t('room.common.endError'), { reason: chatErrorMessage(error, t('room.common.tryAgainLower')) }),
      );
      setIsEnding(false);
      return;
    }
    await disconnect().catch(() => undefined);
    router.push(`/interview/results/${encodeURIComponent(sessionId)}`);
  };

  const leaveRoom = () => {
    setShowLeaveConfirm(false);
    void disconnect()
      .catch(() => undefined)
      .finally(() => router.push(backUrl));
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
      <VoiceRoomHeader
        mode={mode}
        jobTitle={jobTitle}
        status={currentStatus}
        isEnding={isEnding}
        onBack={() => (progress?.isClosed || terminalEvent ? leaveRoom() : setShowLeaveConfirm(true))}
        onEnd={() => setShowEndModal(true)}
        progress={progress}
      />
      {progress ? (
        <ChatStageStepper
          currentStage={progress.stage}
          sessionStatus={progress.isClosed ? 'CLOSED' : 'OPEN'}
          turns={progress.turns}
        />
      ) : null}
      {terminalEvent ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#14244B]/90 p-6 text-center text-white"
        >
          <p className="font-display text-2xl font-semibold">{t('room.voice.endedTitle')}</p>
          <p className="text-sm text-white/80">{t('room.voice.openingReport')}</p>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:p-4">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_center,_#2B4FA8_0%,_#1C3270_45%,_#14244B_100%)] p-5 pb-24">
          <div className="absolute left-4 top-4 z-[5]">
            <StatusPill label={currentStatus.label} tone={currentStatus.tone} onDark />
          </div>

          {mode === 'video' ? (
            <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex min-h-56 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                <SpeakerOrb label={t('room.common.interviewer')} role="ai" active={isAgentSpeaking} icon={AI_ICON} />
              </div>
              <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                {/* Keep the <video> mounted: useLiveKitRoom attaches the local track to it. */}
                <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                {!cameraEnabled ? (
                  <div className="relative flex flex-col items-center gap-2 text-white/70">
                    <VideoOff className="size-8" aria-hidden="true" />
                    <span className="text-xs font-semibold">{t('room.voice.cameraOff')}</span>
                  </div>
                ) : null}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {t('room.common.you')}{isUserSpeaking ? ` · ${t('room.voice.speakingSuffix')}` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
              <SpeakerOrb label={t('room.common.interviewer')} role="ai" active={isAgentSpeaking} icon={AI_ICON} />
              <VoiceActivityBars agentSpeaking={isAgentSpeaking} userSpeaking={isUserSpeaking} />
              <SpeakerOrb label={t('room.common.you')} role="user" active={isUserSpeaking} icon={USER_ICON} />
            </div>
          )}

          {isConnected ? (
            <div
              role="toolbar"
              aria-label={t('room.voice.controlsAria')}
              className="absolute bottom-4 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#1C3270] p-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]"
            >
              <ControlButton
                label={micEnabled ? t('room.voice.micOff') : t('room.voice.micOn')}
                onClick={() => void toggleMic()}
                active={micEnabled}
                icon={micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              />
              {mode === 'video' ? (
                <ControlButton
                  label={cameraEnabled ? t('room.voice.cameraOffAction') : t('room.voice.cameraOn')}
                  onClick={() => void toggleCamera()}
                  active={cameraEnabled}
                  icon={cameraEnabled ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
                />
              ) : null}
              <ControlButton
                label={t('room.voice.repeat')}
                onClick={() => void sendAnswerCommand('question.repeat')}
                disabled={!isAgentConnected || turnState === 'processing'}
                active={false}
                icon={<Repeat className="size-5" />}
              />
              <button
                type="button"
                onClick={() => void sendAnswerCommand('answer.commit')}
                disabled={!isAgentConnected || isAgentSpeaking || turnState === 'processing'}
                aria-label={t('room.voice.doneAria')}
                title={t('room.voice.doneAria')}
                className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('room.voice.done')}
              </button>
              <ControlButton
                label={t('room.common.endInterview')}
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
              {interimTranscript ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="m-3 rounded-2xl bg-[#F7F9FD] p-3 text-xs text-[#607096]"
                >
                  <span className="font-semibold text-[#204195]">{t('voice.transcribing')}</span>{' '}
                  <span>{interimTranscript}</span>
                </p>
              ) : null}
              {livekitError && isConnected ? (
                <p role="alert" className="m-3 flex items-start gap-2 rounded-2xl bg-[#FDF2F2] p-3 text-xs text-[#C43B3B]">
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
        onConfirm={(reason) => void endRoom(reason)}
        isSubmitting={isEnding}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title={t('room.common.leaveConfirmTitle')}
        body={t('room.common.leaveConfirmBody')}
        confirmLabel={t('room.common.leaveConfirm')}
        cancelLabel={t('room.common.continueInterview')}
        onConfirm={leaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
