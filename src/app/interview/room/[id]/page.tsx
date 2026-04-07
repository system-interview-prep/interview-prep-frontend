'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
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

const CHAT_WIDTH_STORAGE_KEY = 'videoRoomChatWidthPx';
const MIN_CHAT_W = 220;
/** Upper cap (px); real max also depends on viewport — see getMaxChatWidth(). */
const MAX_CHAT_ABS = 2000;
const DEFAULT_CHAT_W = 400;

/** Lets chat grow with the window: reserve space for the video column, cap absolute width. */
function getMaxChatWidth(): number {
  if (typeof window === 'undefined') return MAX_CHAT_ABS;
  const vw = window.innerWidth;
  const reserveForVideo = 360;
  return Math.max(MIN_CHAT_W, Math.min(MAX_CHAT_ABS, vw - reserveForVideo));
}

function RoomContent() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const language = searchParams.get('language') ?? 'English';

  const { localStream, isConnected, toggleCamera, hangUp } = useWebRTC(roomId);
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

  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_W);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_WIDTH_STORAGE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) {
          const max = getMaxChatWidth();
          setChatWidth(Math.min(max, Math.max(MIN_CHAT_W, n)));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktopLayout(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setChatWidth((w) => {
        const max = getMaxChatWidth();
        return Math.min(max, Math.max(MIN_CHAT_W, w));
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleChatResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = chatWidth;
      let lastW = startW;

      const onMove = (ev: MouseEvent) => {
        const max = getMaxChatWidth();
        lastW = Math.min(max, Math.max(MIN_CHAT_W, startW + (startX - ev.clientX)));
        setChatWidth(lastW);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(lastW));
        } catch {
          /* ignore */
        }
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [chatWidth]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface font-body text-on-surface">
      <InterviewRoomHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-primary/[0.06] via-surface to-tertiary/[0.05] p-2 sm:p-3 lg:min-w-0 lg:min-w-[280px] lg:flex-1 lg:p-4">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-[#f4f6f8] pb-16 sm:rounded-3xl sm:pb-[4.5rem]">
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

            <div className="grid min-h-0 flex-1 grid-cols-1 content-stretch gap-3 p-2 sm:grid-cols-2 sm:gap-3 sm:p-3 lg:min-h-0">
              <div className="relative min-h-[44vh] w-full sm:min-h-[min(52vh,50dvh)] lg:min-h-[min(68vh,calc(100vh-11rem))]">
                <VideoPlayer stream={localStream} label={t('room.you')} muted />
              </div>
              <div className="relative min-h-[44vh] w-full sm:min-h-[min(52vh,50dvh)] lg:min-h-[min(68vh,calc(100vh-11rem))]">
                <SimliAvatar />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex flex-col items-center gap-1 px-2 sm:bottom-3 sm:px-3">
              <div
                className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${
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
                onToggleCamera={toggleCamera}
                onToggleDictation={toggleDictation}
                onEndSession={handleHangUp}
              />
            </div>
          </div>
        </main>

        {/* Drag to resize chat width (desktop only) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('room.resizeChat')}
          title={t('room.resizeChat')}
          className="group relative hidden w-3 shrink-0 cursor-col-resize select-none items-center justify-center lg:flex"
          onMouseDown={handleChatResizeStart}
        >
          <span className="h-16 w-1 rounded-full bg-outline-variant/35 transition-colors group-hover:bg-primary/50 group-active:bg-primary" />
        </div>

        <aside
          id="video-room-chat-panel"
          className="flex h-[min(36vh,280px)] w-full min-w-0 shrink-0 border-t border-outline-variant/20 bg-surface-container-low/50 lg:h-full lg:min-h-0 lg:border-l lg:border-t-0"
          style={
            isDesktopLayout
              ? {
                  width: chatWidth,
                  minWidth: MIN_CHAT_W,
                  maxWidth: getMaxChatWidth(),
                  flexShrink: 0,
                }
              : undefined
          }
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
