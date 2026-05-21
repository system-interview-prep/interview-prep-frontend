'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChatMessage } from '../components/interview/ChatBox';
import { sendVideoCallVoiceChatMessage } from '../lib/aiService';

const VIDEO_CALL_ID_KEY = 'video.callId';

function nowTs(): string {
  return new Date().toISOString();
}

function getCallIdFromSessionStorage(): string | null {
  try {
    return sessionStorage.getItem(VIDEO_CALL_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * useVideoCallChat
 * - Dành riêng cho phòng video-call (AI hỏi/đáp + TTS)
 * - Gọi REST endpoint `/interview/video-calls/:callId/chat-voice` (KHÔNG dùng Socket /chat)
 * - Sau khi nhận audioBase64, dispatch `onSimliAudio` để SimliAvatar nhận.
 */
export function useVideoCallChat(params: { language: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setCallId(getCallIdFromSessionStorage());
  }, []);

  const sendMessage = useCallback(
    async ({ content }: { roomId: string; content: string; language?: string }) => {
      const text = content.trim();
      if (!text) return;
      const activeCallId = callId || getCallIdFromSessionStorage();
      if (!activeCallId) {
        console.error('Missing video.callId in sessionStorage');
        return;
      }

      const userMsg: ChatMessage = {
        senderId: 'me',
        senderName: 'Me',
        content: text,
        timestamp: nowTs(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setIsSending(true);
      try {
        const data = await sendVideoCallVoiceChatMessage({
          callId: activeCallId,
          prompt: text,
          language: (params.language || 'english').toLowerCase(),
        });

        const aiMsg: ChatMessage = {
          senderId: 'ai',
          senderName: 'AI Interviewer',
          content: data.reply || '',
          timestamp: nowTs(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (data.audioBase64) {
          window.dispatchEvent(
            new CustomEvent('onSimliAudio', { detail: data.audioBase64 }),
          );
        }
      } catch (e) {
        console.error('[VideoCall AI] failed', e);
      } finally {
        setIsSending(false);
      }
    },
    [callId, params.language],
  );

  return { messages, sendMessage, callId, isSending };
}

