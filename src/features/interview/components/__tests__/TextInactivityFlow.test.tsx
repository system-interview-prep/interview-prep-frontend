// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRuntimeResponse } from '../../services/interviewChat.service';
import type { InterviewTextRuntime } from '../../services/interviewRuntime.service';
import { TEXT_IDLE_DRAFT_MS, TEXT_IDLE_EMPTY_MS, TEXT_IDLE_WARNING_MS } from '../../utils/textInactivity';

const api = vi.hoisted(() => ({
  start: vi.fn(), sendMessage: vi.fn(), getRuntime: vi.fn(), complete: vi.fn(),
  getTextRuntime: vi.fn(), getPlan: vi.fn(), answerTurn: vi.fn(), askTurn: vi.fn(),
  completeTextRuntime: vi.fn(), close: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/i18n/LanguageProvider', async () => {
  const { roomVi } = await import('@/i18n/dicts/room.dict');
  return { useLanguage: () => ({ lang: 'vi', t: (key: string) => roomVi[key] ?? key }) };
});
vi.mock('../../services/interviewChat.service', () => ({ interviewChatApi: api }));
vi.mock('../../services/interviewRuntime.service', () => ({ interviewRuntimeApi: api }));
vi.mock('../../hooks/useChatPresence', () => ({
  useChatPresence: () => ({ awaySince: null, graceMinutes: 5, dismissAway: vi.fn() }),
}));
vi.mock('@/components/interview/InteractiveCodeSandbox', () => ({
  default: ({ starterCode }: { starterCode: string }) => <textarea aria-label="Trình soạn mã" defaultValue={starterCode} />,
}));
vi.mock('../ChatRoomParts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ChatRoomParts')>();
  return { ...actual, ChatRoomHeader: ({ onEnd }: { onEnd: () => void }) => <button onClick={onEnd}>Kết thúc</button> };
});
import InterviewChatRoom from '../InterviewChatRoom';
import StructuredTextInterview from '../StructuredTextInterview';

function chatRuntime(coding = false): ChatRuntimeResponse {
  return {
    sessionId: 'chat-session', sessionStatus: 'OPEN', experienceType: 'interview_chat',
    jobTitle: 'Backend Developer', totalTurns: 2, currentTurnIndex: 0, isAwaitingCandidate: true,
    currentTurn: { turnId: 'turn-1', turnIndex: 0, stage: 'DEEP_DIVE',
      questionType: coding ? 'coding' : 'technical', starterCode: coding ? 'print(1)' : undefined,
      questionText: 'Hãy kể về dự án.' },
    messages: [{ messageId: 'question-1', sessionId: 'chat-session', role: 'assistant',
      messageType: 'MAIN_QUESTION', turnId: 'turn-1', sequence: 1, content: 'Hãy kể về dự án.',
      createdAt: '2026-11-07T02:00:00Z' }],
  };
}

function practiceRuntime(): InterviewTextRuntime {
  const turn = { turnId: 'practice-turn', turnIndex: 0, status: 'ASKED', questionVersionId: 'q-1',
    rubricVersionId: 'rubric-1', question: { questionType: 'technical', questionText: 'Giải thích kiến trúc dự án.' } };
  return { sessionId: 'practice-session', sessionStatus: 'OPEN', completed: false,
    progress: { answered: 0, total: 2 }, currentTurn: turn, turns: [turn] };
}

describe('inactivity in the real text interview composers', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T09:00:00+07:00'));
    vi.resetAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    HTMLElement.prototype.scrollIntoView = vi.fn();
    api.start.mockResolvedValue(chatRuntime());
    api.getRuntime.mockResolvedValue(chatRuntime());
    api.getTextRuntime.mockResolvedValue(practiceRuntime());
    api.getPlan.mockRejectedValue(new Error('No auxiliary plan'));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const mount = async (practice = false) => {
    await act(async () => root.render(<StrictMode>{practice
      ? <StructuredTextInterview sessionId="practice-session" />
      : <InterviewChatRoom sessionId="chat-session" />}</StrictMode>));
  };
  const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
  const type = async (value: string, selector = 'textarea') => {
    const textarea = container.querySelector<HTMLTextAreaElement>(selector)!;
    expect(textarea).not.toBeNull();
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, value);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return textarea;
  };
  const resume = async () => {
    const button = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    await act(async () => button.click());
  };

  it('warns then pauses an empty chat without sending a message or ending the interview', async () => {
    await mount();
    await advance(TEXT_IDLE_EMPTY_MS);
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Bạn chưa tương tác');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await advance(TEXT_IDLE_WARNING_MS);
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Tạm dừng soạn câu trả lời');
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(api.complete).not.toHaveBeenCalled();
    await resume();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await advance(TEXT_IDLE_EMPTY_MS - 1);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it.each([false, true])('keeps a long draft through pause and continue (practice=%s)', async (practice) => {
    await mount(practice);
    const draft = 'Em phụ trách backend API. '.repeat(100);
    const input = await type(draft);
    await act(async () => input.focus());
    await advance(TEXT_IDLE_EMPTY_MS);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await advance(TEXT_IDLE_DRAFT_MS - TEXT_IDLE_EMPTY_MS + TEXT_IDLE_WARNING_MS);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(input.value).toBe(draft);
    await resume();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe(draft);
    expect(document.activeElement).toBe(input);
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(api.answerTurn).not.toHaveBeenCalled();
  });

  it('keeps the editor active while the candidate writes for twenty minutes', async () => {
    await mount();
    for (let minute = 0; minute < 20; minute += 1) {
      await advance(60_000);
      await type(`Bản nháp đang sửa ${minute}`);
    }
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).not.toContain('Bạn chưa tương tác');
    expect(api.sendMessage).not.toHaveBeenCalled();
  });

  it('does not interrupt IME composition or send its Enter key', async () => {
    await mount();
    const input = container.querySelector<HTMLTextAreaElement>('textarea')!;
    await act(async () => { input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); });
    await type('Trường đại học');
    await advance(20 * 60_000);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
    });
    expect(api.sendMessage).not.toHaveBeenCalled();
    await act(async () => { input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); });
    await advance(TEXT_IDLE_DRAFT_MS + TEXT_IDLE_WARNING_MS);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(input.value).toBe('Trường đại học');
  });

  it('does not open another modal while waiting for the AI', async () => {
    let finish!: (value: unknown) => void;
    api.sendMessage.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    await mount();
    await type('Câu trả lời của em');
    await act(async () => { container.querySelector<HTMLTextAreaElement>('textarea')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ); });
    expect(api.sendMessage).toHaveBeenCalledOnce();
    await advance(15 * 60_000);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => finish({
      userMessage: { ...chatRuntime().messages[0], role: 'user', messageId: 'answer-1', content: 'Câu trả lời của em' },
      assistantResponse: { ...chatRuntime().messages[0], messageId: 'question-2' },
      sessionStatus: 'OPEN', turnStatus: { completed: false, turnIndex: 0 },
    }));
    await advance(TEXT_IDLE_EMPTY_MS - 100);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not count idle time while Core is not awaiting a candidate response', async () => {
    api.start.mockResolvedValue({ ...chatRuntime(), isAwaitingCandidate: false });
    await mount();
    await advance(15 * 60_000);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).not.toContain('Bạn chưa tương tác');
  });

  it('does not stack an inactivity modal over the end confirmation', async () => {
    await mount();
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    await advance(15 * 60_000);
    expect(container.textContent).not.toContain('Tạm dừng soạn câu trả lời');
    expect(api.complete).not.toHaveBeenCalled();
  });

  it('suspends inactivity while the tab is hidden and starts a fresh window on return', async () => {
    await mount();
    await type('Bản nháp đang suy nghĩ');
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(30 * 60_000);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(TEXT_IDLE_DRAFT_MS - 1);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Bản nháp đang suy nghĩ');
  });

  it('counts typing in the nested code editor instead of pausing a coding candidate', async () => {
    api.start.mockResolvedValue(chatRuntime(true));
    await mount();
    for (let step = 0; step < 8; step += 1) {
      await advance(60_000);
      await type(`print(${step})`, 'textarea[aria-label="Trình soạn mã"]');
    }
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await advance(TEXT_IDLE_DRAFT_MS + TEXT_IDLE_WARNING_MS);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    await resume();
    expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Trình soạn mã"]')!.value).toBe('print(7)');
  });
});
