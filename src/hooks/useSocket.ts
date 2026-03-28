import { useEffect, useState, useCallback } from 'react';
import { chatService } from '../services/socket';
import type { ChatMessage } from '../components/interview/ChatBox';

/**
 * useSocket – manages Socket.IO chat room connection.
 * Emits join-room on mount and listens for incoming messages.
 * After each send-message, the server will reply with an AI message on the same 'message' event.
 */
export function useSocket(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    chatService.emit('join-room', { roomId, userName: 'Me' });

    chatService.on('message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    chatService.on('ai-error', ({ message }: { message: string }) => {
      console.error('[AI Error]', message);
    });

    // Bắt thêm luồng âm thanh PCM Base64 gửi qua socket
    chatService.on('ai-audio', ({ audioBase64 }: { audioBase64: string }) => {
      // Trigger event DOM, SimliAvatar sẽ bắt sự kiện này để convert sang Uint8Array
      window.dispatchEvent(new CustomEvent('onSimliAudio', { detail: audioBase64 }));
    });

    return () => {
      chatService.emit('leave-room', { roomId, userName: 'Me' });
      chatService.off('message');
      chatService.off('ai-error');
      chatService.off('ai-audio');
    };
  }, [roomId]);

  const sendMessage = useCallback(
    ({ content, language = 'english' }: { roomId: string; content: string; language?: string }) => {
      chatService.emit('send-message', {
        roomId,
        senderId: 'me',
        senderName: 'Me',
        content,
        language,
      });
    },
    [roomId],
  );

  return { messages, sendMessage };
}
