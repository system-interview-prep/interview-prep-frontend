'use client';

import { Suspense, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '../../../../components/interview/VideoPlayer';
import SimliAvatar from '../../../../components/interview/SimliAvatar';
import ControlBar from '../../../../components/interview/ControlBar';
import ChatBox from '../../../../components/interview/ChatBox';
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

  const { localStream, remoteStream, isConnected, toggleMic, toggleCamera, hangUp } = useWebRTC(roomId);
  const { messages, sendMessage } = useSocket(roomId);

  const handleVoiceInput = useCallback((text: string) => {
    sendMessage({ roomId, content: text, language });
  }, [roomId, language, sendMessage]);

  const {
    isRecording,
    interimTranscript,
    recognitionError,
    handleMicToggle: toggleRecording
  } = useVoiceRecognition({
    language: language.toLowerCase() === 'vietnamese' ? 'vietnamese' : 'english',
    onFinalTranscript: handleVoiceInput
  });

  const handleHangUp = () => {
    hangUp();
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Video area */}
      <div className="flex flex-col flex-1 gap-4 p-4 relative">
        {/* Helper UI when speaking */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/80 px-4 py-2 rounded-full text-sm z-10 shadow-lg flex items-center gap-2">
            <span className="animate-pulse">🔴</span> 
            {interimTranscript || t('room.listening')}
          </div>
        )}
        {recognitionError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/80 px-4 py-2 rounded-full text-sm z-10 shadow-lg">
            {recognitionError}
          </div>
        )}

        <div className="flex gap-4 flex-1">
          <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-gray-700 bg-gray-800">
             <VideoPlayer stream={localStream} label={t('room.you')} muted />
          </div>
          <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-gray-700 bg-gray-800 relative">
             <SimliAvatar />
          </div>
        </div>
        <ControlBar
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onHangUp={handleHangUp}
          isConnected={isConnected}
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
        />
      </div>

      {/* Chat sidebar */}
      <aside className="w-80 border-l border-gray-700">
        <ChatBox
          messages={messages}
          onSendMessage={(content) => sendMessage({ roomId, content, language })}
        />
      </aside>
    </div>
  );
}

export default function RoomPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-900 text-white">{t('room.loading')}</div>}>
      <RoomContent />
    </Suspense>
  );
}
