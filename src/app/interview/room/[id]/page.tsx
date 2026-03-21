'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '../../../../components/interview/VideoPlayer';
import ControlBar from '../../../../components/interview/ControlBar';
import ChatBox from '../../../../components/interview/ChatBox';
import { useWebRTC } from '../../../../hooks/useWebRTC';
import { useSocket } from '../../../../hooks/useSocket';

function RoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const language = searchParams.get('language') ?? 'English';

  const { localStream, remoteStream, isConnected, toggleMic, toggleCamera, hangUp } = useWebRTC(roomId);
  const { messages, sendMessage } = useSocket(roomId);

  const handleHangUp = () => {
    hangUp();
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Video area */}
      <div className="flex flex-col flex-1 gap-4 p-4">
        <div className="flex gap-4 flex-1">
          <VideoPlayer stream={localStream} label="You" muted />
          <VideoPlayer stream={remoteStream} label="Interviewer" />
        </div>
        <ControlBar
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onHangUp={handleHangUp}
          isConnected={isConnected}
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
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading room…</div>}>
      <RoomContent />
    </Suspense>
  );
}
