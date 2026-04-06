'use client';

import { Suspense, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '../../../../components/interview/VideoPlayer';
import SimliAvatar from '../../../../components/interview/SimliAvatar';
import { VideoRoomFloatingBar } from '../../../../components/interview/VideoRoomFloatingBar';
import ChatBox from '../../../../components/interview/ChatBox';
import { InterviewRoomHeader } from '../../../component/InterviewRoomHeader';
import { useWebRTC } from '../../../../hooks/useWebRTC';
import { useSocket } from '../../../../hooks/useSocket';
import { useVoiceRecognition } from '../../../../hooks/useVoiceRecognition';
import { useLanguage } from '../../../../i18n/LanguageProvider';

function RoomContent() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const language = searchParams.get('language') ?? 'English';

  const { localStream, isConnected, toggleMic, toggleCamera, hangUp } = useWebRTC(roomId);
  const { messages, sendMessage } = useSocket(roomId);

  const handleVoiceInput = useCallback((text: string) => {
    sendMessage({ roomId, content: text, language });
  }, [roomId, language, sendMessage]);

  const {
    recorderSupported,
    isRecording,
    interimTranscript,
    recognitionError,
    handleMicToggle: toggleDictation,
  } = useVoiceRecognition({
    language: language.toLowerCase() === 'vietnamese' ? 'vietnamese' : 'english',
    onFinalTranscript: handleVoiceInput,
  });

  const handleHangUp = () => {
    hangUp();
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface font-body text-on-surface">
      <InterviewRoomHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-primary/[0.06] via-surface to-tertiary/[0.05] p-3 sm:p-4 lg:p-6">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-[#f4f6f8] pb-[7.5rem] sm:rounded-3xl sm:pb-28">
            {isRecording && (
              <div className="absolute left-1/2 top-3 z-30 flex max-w-[min(100%,28rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-primary/20 bg-surface-container-lowest/95 px-4 py-2.5 text-sm text-on-surface shadow-lg backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="truncate font-medium">{interimTranscript || t('room.listening')}</span>
              </div>
            )}
            {recognitionError && (
              <div
                className="absolute left-1/2 top-3 z-30 max-w-[min(100%,28rem)] -translate-x-1/2 rounded-full border border-error/25 bg-error-container/95 px-4 py-2.5 text-center text-sm text-on-error-container shadow-lg backdrop-blur-md"
                role="alert"
              >
                {recognitionError}
              </div>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
              <div className="relative aspect-video w-full min-h-0">
                <VideoPlayer stream={localStream} label={t('room.you')} muted />
              </div>
              <div className="relative aspect-video w-full min-h-0">
                <SimliAvatar />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2 px-2 sm:bottom-5 sm:px-4">
              <div
                className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                  isConnected
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                    : 'border-outline-variant/40 bg-surface-container-lowest/90 text-on-surface-variant'
                }`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`h-2 w-2 rounded-full ${isConnected ? 'animate-pulse bg-emerald-500' : 'bg-on-surface-variant/50'}`}
                  aria-hidden
                />
                {isConnected ? t('room.connected') : t('room.disconnected')}
              </div>
              <VideoRoomFloatingBar
                recorderSupported={recorderSupported}
                isRecording={isRecording}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleDictation={toggleDictation}
                onEndSession={handleHangUp}
              />
            </div>
          </div>
        </main>

        <aside
          id="video-room-chat-panel"
          className="flex h-[min(40vh,320px)] w-full shrink-0 border-t border-outline-variant/20 bg-surface-container-low/50 lg:h-auto lg:w-[22rem] lg:border-l lg:border-t-0 xl:w-[24rem]"
        >
          <ChatBox
            messages={messages}
            onSendMessage={(content) => sendMessage({ roomId, content, language })}
          />
        </aside>
      </div>
    </div>
  );
}

export default function RoomPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-surface text-on-surface">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className="font-headline text-sm font-semibold">{t('room.loading')}</p>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
