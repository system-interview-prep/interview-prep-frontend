'use client';

import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';

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
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const commitSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setDraft('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitSend();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest/95">
      <div className="shrink-0 border-b border-outline-variant/20 bg-gradient-to-r from-primary/10 via-surface-container-low/80 to-tertiary/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">forum</span>
          <h2 className="font-headline text-sm font-bold tracking-tight text-on-surface">
            {t('room.chatPanelTitle')}
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
        {messages.length === 0 && (
          <p className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/60 px-4 py-8 text-center text-sm text-on-surface-variant">
            {t('room.chatEmpty')}
          </p>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => {
            const isAi = m.senderId === 'ai';
            return (
              <div
                key={i}
                className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                    isAi ? 'ai-gradient-bg text-on-primary' : 'bg-primary-fixed text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isAi ? 'psychology' : 'person'}
                  </span>
                </div>
                <div className={`min-w-0 max-w-[min(100%,28rem)] ${isAi ? '' : 'text-right'}`}>
                  <div
                    className={`mb-1 flex flex-wrap items-baseline gap-2 ${isAi ? '' : 'flex-row-reverse justify-end'}`}
                  >
                    <span className="font-headline text-xs font-bold text-on-surface">
                      {m.senderName}
                    </span>
                    {m.timestamp && (
                      <span className="text-[10px] text-on-surface-variant tabular-nums">{m.timestamp}</span>
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-on-surface shadow-sm border ${
                      isAi
                        ? 'rounded-tl-sm border-outline-variant/25 bg-surface-container-low border-l-4 border-l-primary/35'
                        : 'rounded-tr-sm border-outline-variant/20 bg-surface-container-high/90'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <form
        className="shrink-0 border-t border-outline-variant/15 bg-surface-container-low/80 px-3 py-3 sm:px-4 backdrop-blur-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/25 transition-all">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('room.inputPlaceholder')}
            rows={2}
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitSend();
              }
            }}
            aria-label={t('room.inputPlaceholder')}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            aria-label={t('voice.sendPrompt')}
          >
            <span className="material-symbols-outlined text-[22px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
