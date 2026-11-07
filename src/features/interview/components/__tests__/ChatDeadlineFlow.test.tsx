// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRuntimeResponse } from '../../services/interviewChat.service';
import { chatDeadlineDelay } from '../../utils/chatDeadline';
import { roomVi } from '@/i18n/dicts/room.dict';

const api = vi.hoisted(() => ({ start: vi.fn(), getRuntime: vi.fn(), sendMessage: vi.fn(), complete: vi.fn(),
  get: vi.fn(), getReflection: vi.fn(), getEvaluation: vi.fn(), evaluateSession: vi.fn() }));
const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav,
  useParams: () => ({ id: 'five-minute-chat' }), useSearchParams: () => new URLSearchParams() }));
vi.mock('@/i18n/LanguageProvider', async () => {
  const { roomVi } = await import('@/i18n/dicts/room.dict');
  const { reportVi } = await import('@/i18n/dicts/report.dict');
  return { useLanguage: () => ({ lang: 'vi', t: (key: string) => roomVi[key] ?? reportVi[key] ?? key }) };
});
vi.mock('../../services/interviewChat.service', () => ({ interviewChatApi: api }));
vi.mock('../../services/interviewRuntime.service', () => ({ interviewRuntimeApi: api }));
vi.mock('../../services/interviewReport.service', () => ({ interviewReportApi: api }));
vi.mock('../InterviewReportView', () => ({ default: () => <p>Báo cáo hoàn tất</p> }));
vi.mock('../../hooks/useChatPresence', () => ({ useChatPresence: () => ({ awaySince: null, graceMinutes: 5, dismissAway: vi.fn() }) }));
vi.mock('@/components/interview/InteractiveCodeSandbox', () => ({ default: () => null }));
import InterviewChatRoom from '../InterviewChatRoom';
import InterviewResultsPage from '@/app/(interview-fullscreen)/interview/results/[id]/page';

function runtime(): ChatRuntimeResponse {
  return { sessionId: 'five-minute-chat', sessionStatus: 'OPEN', experienceType: 'interview_chat',
    jobTitle: 'Backend Developer', totalTurns: 2, currentTurnIndex: 0, isAwaitingCandidate: true,
    durationMinutes: 5, startedAt: '2026-11-07T02:00:00Z',
    expiresAt: '2026-11-07T02:05:00Z', serverTime: '2026-11-07T02:00:00Z',
    currentTurn: { turnId: 'turn-1', turnIndex: 0, stage: 'DEEP_DIVE', questionType: 'technical', questionText: 'Kể về dự án.' },
    turns: [{ turnId: 'turn-1', turnIndex: 0, stage: 'DEEP_DIVE', status: 'ASKED' }],
    messages: [{ messageId: 'q-1', sessionId: 'five-minute-chat', role: 'assistant',
      messageType: 'MAIN_QUESTION', turnId: 'turn-1', sequence: 1, content: 'Kể về dự án.', createdAt: '2026-11-07T02:00:00Z' }],
  };
}
const closed = (): ChatRuntimeResponse => ({ ...runtime(), sessionStatus: 'CLOSED', endReason: 'HARD_TIMEOUT', isAwaitingCandidate: false });

describe('Chat selected duration -> Core closure -> grading page', () => {
  let container: HTMLDivElement, root: Root;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T02:00:00Z'));
    vi.resetAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    HTMLElement.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    api.start.mockResolvedValue(runtime());
    api.getRuntime.mockResolvedValue(closed());
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });
  const mount = async () => { await act(async () => root.render(<StrictMode><InterviewChatRoom sessionId="five-minute-chat" /></StrictMode>)); };
  const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
  const type = async (value: string) => {
    const input = container.querySelector<HTMLTextAreaElement>('textarea')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  it('ends at five minutes without requiring a message, including when inactivity pause is open', async () => {
    await mount();
    await advance(299_999);
    expect(nav.replace).not.toHaveBeenCalled();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    await advance(1);
    expect(api.getRuntime).toHaveBeenCalledOnce();
    expect(nav.replace).toHaveBeenCalledExactlyOnceWith('/interview/results/five-minute-chat');
    expect(api.complete).not.toHaveBeenCalled(); // Browser cannot invent HARD_TIMEOUT.
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not extend the interview deadline while a long draft is being edited', async () => {
    await mount();
    for (let minute = 1; minute <= 4; minute += 1) {
      await advance(60_000);
      await type(`Câu trả lời dài, phần ${minute}`);
    }
    await advance(60_000);
    expect(nav.replace).toHaveBeenCalledExactlyOnceWith('/interview/results/five-minute-chat');
    expect(api.sendMessage).not.toHaveBeenCalled();
  });

  it('waits for authoritative closure before navigating or grading and locks sending at expiry', async () => {
    let finish!: (value: ChatRuntimeResponse) => void;
    api.getRuntime.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    await mount(); await type('Bản nháp chưa gửi'); await advance(300_000);
    expect(container.textContent).toContain('Đã hết thời gian');
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.disabled).toBe(true);
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Bản nháp chưa gửi');
    expect(nav.replace).not.toHaveBeenCalled();
    expect(api.evaluateSession).not.toHaveBeenCalled();
    await act(async () => finish(closed()));
    expect(nav.replace).toHaveBeenCalledOnce();
  });

  it('retains an unsent draft and retries a failed expiry check instead of faking completion', async () => {
    api.getRuntime.mockRejectedValueOnce(new Error('Network down')).mockResolvedValue(closed());
    await mount(); await type('Nội dung chưa gửi'); await advance(300_000);
    expect(container.textContent).toContain('chưa xác nhận được kết thúc');
    expect(nav.replace).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Nội dung chưa gửi');
    await advance(3000);
    expect(nav.replace).toHaveBeenCalledOnce();
  });

  it('uses the server clock when the browser clock is wrong', async () => {
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    await mount(); await advance(299_999);
    expect(nav.replace).not.toHaveBeenCalled();
    await advance(1);
    expect(nav.replace).toHaveBeenCalledOnce();
  });

  it('does not start the budget in a lobby without an opening question', async () => {
    api.start.mockResolvedValue({ ...runtime(), startedAt: null, expiresAt: null, messages: [], currentTurn: null });
    await mount(); await advance(30 * 60_000);
    expect(api.getRuntime).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('checks expiry on returning to a suspended tab before the throttled timer fires', async () => {
    await mount();
    vi.setSystemTime(new Date('2026-11-07T02:08:00Z'));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(api.getRuntime).toHaveBeenCalledOnce();
    expect(nav.replace).toHaveBeenCalledExactlyOnceWith('/interview/results/five-minute-chat');
  });

  it('recovers an in-flight answer rejected because Core closed during model processing', async () => {
    await mount();
    api.sendMessage.mockRejectedValue({ response: { status: 409 } });
    await type('Câu trả lời đã gửi trước hạn');
    const submit = container.querySelector<HTMLButtonElement>(`button[aria-label="${roomVi['room.chat.sendAria']}"]`)!;
    await act(async () => { submit.click(); });
    expect(api.sendMessage).toHaveBeenCalledOnce();
    expect(api.getRuntime).toHaveBeenCalledOnce();
    expect(nav.replace).toHaveBeenCalledExactlyOnceWith('/interview/results/five-minute-chat');
    expect(api.complete).not.toHaveBeenCalled();
  });

  it('does not busy-loop if an OPEN snapshot arrives at the expired clock', async () => {
    api.getRuntime.mockResolvedValue({ ...runtime(), serverTime: '2026-11-07T02:05:00Z' });
    await mount(); await advance(300_000);
    expect(api.getRuntime).toHaveBeenCalledOnce();
    await advance(999);
    expect(api.getRuntime).toHaveBeenCalledOnce();
    api.getRuntime.mockResolvedValue(closed());
    await advance(1);
    expect(api.getRuntime).toHaveBeenCalledTimes(2);
    expect(nav.replace).toHaveBeenCalledOnce();
  });

  it('starts the existing grading screen after the timed session has closed', async () => {
    await mount(); await advance(300_000);
    expect(nav.replace).toHaveBeenCalledOnce();
    const data = closed();
    data.messages.push({ ...runtime().messages[0], role: 'user', messageType: 'CANDIDATE_ANSWER',
      messageId: 'a-1', content: 'Câu trả lời đã gửi', sequence: 2 });
    api.getRuntime.mockResolvedValue(data);
    api.get.mockResolvedValue({ sessionId: 'five-minute-chat', endedAt: '2026-11-07T02:05:00Z', endReason: 'HARD_TIMEOUT' });
    api.getReflection.mockResolvedValue(null);
    api.getEvaluation.mockRejectedValue({ response: { status: 404 } });
    api.evaluateSession.mockReturnValue(new Promise(() => undefined));
    await act(async () => root.render(<InterviewResultsPage />));
    expect(api.evaluateSession).toHaveBeenCalledExactlyOnceWith('five-minute-chat');
    expect(container.textContent).toContain('Đang');
  });
});

describe('deadline parsing', () => {
  it('accepts offset timestamps and counts from the configured start for old APIs', () => {
    const value = { ...runtime(), expiresAt: undefined, serverTime: undefined, startedAt: '2026-11-07T09:00:00+07:00' };
    expect(chatDeadlineDelay(value, Date.parse('2026-11-07T02:04:00Z'))).toBe(60_000);
    expect(chatDeadlineDelay({ ...value, startedAt: 'invalid' }, Date.now())).toBeNull();
  });
});
