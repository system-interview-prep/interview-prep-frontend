'use client';

import { useRef, useEffect } from 'react';

export interface ChatMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface Props {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export default function ChatBox({ messages, onSendMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
        {messages.map((m, i) => {
          const isAi = m.senderId === 'ai';
          return (
            <div
              key={i}
              className={isAi ? 'rounded p-2 bg-gray-800 border-l-2 border-violet-500' : ''}
            >
              <span className={`font-semibold ${isAi ? 'text-violet-400' : 'text-blue-400'}`}>
                {m.senderName}:{' '}
              </span>
              <span>{m.content}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="flex gap-2 p-3 border-t border-gray-700"
        onSubmit={e => {
          e.preventDefault();
          const input = (e.currentTarget.elements.namedItem('msg') as HTMLInputElement);
          if (!input.value.trim()) return;
          onSendMessage(input.value);
          input.value = '';
        }}
      >
        <input
          name="msg"
          placeholder="Type a message…"
          className="flex-1 bg-gray-800 rounded px-3 py-1 text-sm text-white"
        />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
