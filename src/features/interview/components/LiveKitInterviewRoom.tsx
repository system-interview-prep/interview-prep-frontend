'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, VideoOff } from 'lucide-react';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';
import { ConfirmDialog } from '@components/shared/ConfirmDialog';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { useRuntimeProgress } from '../hooks/useRuntimeProgress';
import { interviewChatApi } from '../services/interviewChat.service';
import { chatErrorMessage } from './ChatRoomParts';
import {
  ControlButton,
  InterviewerPresence,
  PreJoinCard,
  SpeakerCard,
  SpeakerTile,
  StageAlert,
  TurnStatus,
  TranscriptPanel,
  VoiceRoomHeader,
  presenceState,
  voiceStatus,
} from './VoiceRoomParts';
import { VoiceWaveform, type VoiceOrbState } from './VoiceWaveform';
import { CurrentQuestionCard, QuestionTimer } from './CurrentQuestionCard';
import { getStageLabel } from './ChatInterviewProgress';
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
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // True when the dialog was opened by the candidate saying "dừng", not by the
  // End button: choosing to continue then replays the interrupted question.
  const [spokenAbort, setSpokenAbort] = useState(false);
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
    transportError,
    speechOutputError,
    terminalEvent,
    turnState,
  } = useLiveKitRoom({
    sessionId,
    locale,
    cameraOnStart: mode === 'video',
    onAbortRequested: () => {
      setSpokenAbort(true);
      setShowEndModal(true);
    },
  });

  const closeEndModal = () => {
    setShowEndModal(false);
    if (spokenAbort) {
      setSpokenAbort(false);
      void sendAnswerCommand('question.repeat');
    }
  };

  // Re-read question, stage and timers when the transcript grows or the
  // agent's answer window moves (a new question starts after "processing").
  const turnStep = turnState === 'answering' ? 1 : turnState === 'processing' ? 2 : turnState === 'listening' ? 3 : 0;
  const progress = useRuntimeProgress(sessionId, transcript.length * 4 + turnStep + (terminalEvent ? 1000 : 0));
  const presence = presenceState({ agentConnected: isAgentConnected, agentSpeaking: isAgentSpeaking, turnState });

  const currentStatus = useMemo(
    () => voiceStatus(status, isAgentConnected, t, turnState),
    [isAgentConnected, status, t, turnState],
  );
  // Speech recognition is down while the room stays connected: the candidate
  // must not keep answering into a room that cannot hear them.
  const sttDown = isConnected && Boolean(transportError);
  const barStatus = sttDown ? { label: t('room.voice.status.unheard'), tone: 'error' as const } : currentStatus;

  const waveformState: VoiceOrbState =
    !isConnected
      ? 'idle'
      : isAgentSpeaking
      ? 'speaking'
      : turnState === 'processing'
      ? 'thinking'
      : 'listening';

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

  const stageAlerts =
    sttDown || (speechOutputError && isConnected) || (livekitError && isConnected) || endError ? (
      <>
        {sttDown && transportError ? (
          <StageAlert
            title={t('room.voice.sttDown.title')}
            message={transportError}
            action={{ label: t('room.voice.sttDown.leave'), onClick: () => setShowLeaveConfirm(true) }}
          />
        ) : livekitError && isConnected ? (
          <StageAlert message={livekitError} />
        ) : null}
        {speechOutputError && isConnected ? <StageAlert message={speechOutputError} /> : null}
        {endError ? <StageAlert message={endError} onDismiss={() => setEndError(null)} /> : null}
      </>
    ) : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
      <VoiceRoomHeader
        mode={mode}
        jobTitle={jobTitle}
        status={currentStatus}
        onBack={() => (progress?.isClosed || terminalEvent ? leaveRoom() : setShowLeaveConfirm(true))}
        progress={progress}
      />
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
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
          {stageAlerts ? <div className="shrink-0 space-y-2 px-4 pt-4 sm:px-6">{stageAlerts}</div> : null}

          {mode === 'video' ? (
            <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden p-3.5 sm:p-5">
              <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-3">
                <div className="w-full shrink-0">
                  <CurrentQuestionCard
                    stageLabel={getStageLabel(progress?.stage, t)}
                    competency={progress?.question?.competency ?? null}
                    text={progress?.question?.text ?? null}
                    followUpText={progress?.question?.followUpText ?? null}
                    size="compact"
                    timer={
                      <QuestionTimer
                        startedAt={progress?.question?.startedAt ?? null}
                        softSeconds={progress?.question?.softAnswerSeconds ?? null}
                        hardSeconds={progress?.question?.hardAnswerSeconds ?? null}
                        paused={progress?.isClosed}
                      />
                    }
                  />
                </div>
                <div className="my-auto grid w-full flex-1 min-h-0 grid-cols-2 items-center gap-2 sm:gap-3">
                  <SpeakerTile name={t('room.common.interviewer')} tone="ai" active={isAgentSpeaking}>
                    <InterviewerPresence state={presence} size="small" />
                  </SpeakerTile>
                  <div
                    className={`relative flex aspect-[4/3] max-h-full items-center justify-center overflow-hidden rounded-2xl border-2 bg-[#E8EDF5] transition-colors duration-200 ${
                      sttDown ? 'border-[#F5C2C2]' : isUserSpeaking ? 'border-[#287A4B]' : 'border-transparent'
                    }`}
                  >
                    {/* Keep the <video> mounted: useLiveKitRoom attaches the local track to it. */}
                    <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                    {!cameraEnabled ? (
                      <div className="relative flex flex-col items-center gap-2 text-[#607096]">
                        <VideoOff className="size-7" aria-hidden="true" />
                        <span className="hidden text-sm sm:inline">{t('room.voice.cameraOff')}</span>
                      </div>
                    ) : null}
                    <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-[#14244B] shadow-sm">
                      {t('room.common.you')}
                      {sttDown
                        ? ` · ${t('room.voice.candidate.unheard')}`
                        : isUserSpeaking
                          ? ` · ${t('room.voice.speakingSuffix')}`
                          : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden px-4 py-3.5 sm:px-6 sm:py-5">
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-3 sm:gap-4">
                {/* 1. Compact Question Card with QuestionTimer */}
                <div className="w-full shrink-0">
                  <CurrentQuestionCard
                    stageLabel={getStageLabel(progress?.stage, t)}
                    competency={progress?.question?.competency ?? null}
                    text={progress?.question?.text ?? null}
                    followUpText={progress?.question?.followUpText ?? null}
                    size="compact"
                    timer={
                      <QuestionTimer
                        startedAt={progress?.question?.startedAt ?? null}
                        softSeconds={progress?.question?.softAnswerSeconds ?? null}
                        hardSeconds={progress?.question?.hardAnswerSeconds ?? null}
                        paused={progress?.isClosed}
                      />
                    }
                  />
                </div>

                {/* 2. Compact Voice Waveform and Status Indicator */}
                <div className="my-auto flex flex-col items-center justify-center py-2 text-center">
                  <VoiceWaveform state={waveformState} size="compact" />

                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors duration-200 ${
                        waveformState === 'speaking'
                          ? 'border border-[#FCB625]/40 bg-[#FCB625]/20 text-[#8A5A00]'
                          : waveformState === 'thinking'
                          ? 'border border-[#204195]/20 bg-[#EEF2FD] text-[#204195]'
                          : waveformState === 'listening' && isUserSpeaking
                          ? 'border border-[#287A4B]/30 bg-[#EBF7EE] text-[#1B633A]'
                          : 'border border-[#DCE4F3] bg-[#F7F9FD] text-[#607096]'
                      }`}
                    >
                      <span
                        className={`size-2 rounded-full ${
                          waveformState === 'speaking'
                            ? 'bg-[#E59E10] animate-pulse'
                            : waveformState === 'thinking'
                            ? 'bg-[#204195] animate-spin'
                            : waveformState === 'listening' && isUserSpeaking
                            ? 'bg-[#287A4B] animate-pulse'
                            : 'bg-[#A0AEC0]'
                        }`}
                      />
                      <span>
                        {waveformState === 'speaking'
                          ? t('room.voice.status.agentSpeaking')
                          : waveformState === 'thinking'
                          ? t('room.voice.status.processing')
                          : waveformState === 'listening' && isUserSpeaking
                          ? t('room.voice.status.userSpeaking')
                          : t('room.voice.status.yourTurn')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Speaker Presence Cards */}
                <div className="w-full shrink-0">
                  <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2.5 sm:gap-3">
                    <SpeakerCard
                      name={t('room.common.interviewer')}
                      tone="ai"
                      active={isAgentSpeaking}
                      icon="IV"
                    />
                    <SpeakerCard
                      name={t('room.common.you')}
                      tone="user"
                      active={isUserSpeaking && !sttDown}
                      muted={!micEnabled}
                      alert={sttDown}
                      note={
                        sttDown
                          ? t('room.voice.candidate.unheard')
                          : !micEnabled
                            ? t('room.voice.candidate.muted')
                            : undefined
                      }
                      icon={micEnabled ? <Mic className="size-5" aria-hidden="true" /> : <MicOff className="size-5" aria-hidden="true" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call bar: only mic and end interview controls */}
          <div className="flex shrink-0 items-center justify-between border-t border-[#DCE4F3] px-4 py-3 sm:px-6">
            <div className="min-w-0 max-w-full">{isConnected ? <TurnStatus status={barStatus} /> : null}</div>
            <div role="toolbar" aria-label={t('room.voice.controlsAria')} className="flex items-center gap-3">
              <ControlButton
                label={micEnabled ? t('room.voice.micOff') : t('room.voice.micOn')}
                onClick={() => void toggleMic()}
                disabled={!isConnected}
                active={micEnabled}
                icon={micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              />
              {mode === 'video' ? (
                <ControlButton
                  label={cameraEnabled ? t('room.voice.cameraOffAction') : t('room.voice.cameraOn')}
                  onClick={() => void toggleCamera()}
                  disabled={!isConnected}
                  active={cameraEnabled}
                  icon={cameraEnabled ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
                />
              ) : null}
              <ControlButton
                label={t('room.common.endInterview')}
                text={t('room.common.endInterview')}
                onClick={() => setShowEndModal(true)}
                disabled={isEnding}
                active={false}
                danger
                icon={<PhoneOff className="size-5" />}
              />
            </div>
            <div className="hidden sm:block sm:w-28" />
          </div>

          {!isConnected && !terminalEvent && !progress?.isClosed ? (
            <PreJoinCard mode={mode} status={status} error={livekitError} onConnect={() => void connect()} />
          ) : null}
        </section>
        <TranscriptPanel
          lines={transcript}
          agentConnected={isAgentConnected}
          liveText={isConnected && !sttDown ? interimTranscript : undefined}
        />
      </main>

      {/* Remote audio plays through this container: it must stay mounted. */}
      <div ref={remoteAudioContainerRef} className="hidden" aria-hidden="true" />

      <AbortConfirmationModal
        isOpen={showEndModal}
        onClose={closeEndModal}
        onConfirm={(reason) => void endRoom(reason)}
        isSubmitting={isEnding}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title={t('room.common.leaveConfirmTitle')}
        // Same grace period as the backend session reaper (CANDIDATE_LEFT_GRACE_MINUTES).
        body={fmt(t('room.common.leaveConfirmBody'), { n: 5 })}
        confirmLabel={t('room.common.leaveConfirm')}
        cancelLabel={t('room.common.continueInterview')}
        onConfirm={leaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
