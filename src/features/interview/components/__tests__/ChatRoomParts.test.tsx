import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ChatMessage, ChatRuntimeTurn } from '../../services/interviewChat.service';
import { ChatStageStepper, getTimerTone } from '../ChatInterviewProgress';
import {
  ChatClosedFooter,
  ChatComposer,
  chatErrorMessage,
  InterviewGuidePanel,
  MessageBubble,
  StageTipBar,
} from '../ChatRoomParts';

const turns: ChatRuntimeTurn[] = [
  { turnId: 't0', turnIndex: 0, stage: 'WARM_UP', status: 'ANSWERED' },
  { turnId: 't1', turnIndex: 1, stage: 'VALIDATE', status: 'ANSWERED' },
  { turnId: 't2', turnIndex: 2, stage: 'DEEP_DIVE', status: 'ASKED' },
  { turnId: 't3', turnIndex: 3, stage: 'BEHAVIORAL', status: 'PLANNED' },
];

const message = (overrides: Partial<ChatMessage>): ChatMessage => ({
  messageId: 'm1',
  sessionId: 's1',
  role: 'assistant',
  messageType: 'MAIN_QUESTION',
  turnId: 't2',
  sequence: 1,
  content: 'Giải thích event loop trong Node.js.',
  createdAt: '2026-10-09T10:00:00+07:00',
  ...overrides,
});

const noop = () => undefined;

describe('Chat room guide panel', () => {
  it('explains the current stage, how to answer it, and every stage of the session', () => {
    const html = renderToStaticMarkup(
      <InterviewGuidePanel currentStage="DEEP_DIVE" competency="Node.js" sessionStatus="OPEN" turns={turns} answeredCount={2} />
    );

    expect(html).toContain('Bây giờ');
    expect(html).toContain('Chuyên môn');
    expect(html).toContain('Node.js');
    expect(html).toContain('trade-off');
    expect(html).toContain('data-stage="DEEP_DIVE" data-state="current"');
    expect(html).toContain('Đã trả lời 2 lượt');
    // Total turn count changes when the closing turn is inserted: no X/N counter.
    expect(html).not.toMatch(/(?:Lượt|Câu)\s*\d+\s*\/\s*\d+/i);
  });

  it('says an unplanned stage may still happen instead of claiming it is absent', () => {
    const html = renderToStaticMarkup(
      <InterviewGuidePanel currentStage="WARM_UP" sessionStatus="OPEN" turns={turns.slice(0, 1)} answeredCount={0} />
    );
    // CLOSING is inserted by the backend later, so it is optional, not absent.
    expect(html).toContain('data-stage="CLOSING" data-state="optional"');
    expect(html).toContain('Tùy diễn biến phiên');
  });

  it('keeps the mobile stepper scroller positioned so sr-only labels cannot widen the page', () => {
    const html = renderToStaticMarkup(<ChatStageStepper currentStage="DEEP_DIVE" sessionStatus="OPEN" turns={turns} />);
    expect(html).toMatch(/class="relative [^"]*overflow-x-auto/);
  });

  it('shows the closing tip with the two-question limit on small screens', () => {
    const html = renderToStaticMarkup(<StageTipBar currentStage="CLOSING" />);
    expect(html).toContain('Hỏi đáp');
    expect(html).toContain('tối đa 2 câu');
  });
});

describe('Chat messages', () => {
  it('labels an AI question with its type and stage', () => {
    const html = renderToStaticMarkup(
      <MessageBubble message={message({})} stageLabel="Chuyên môn" isClosed={false} isEnding={false} isSending={false} onConfirmAbort={noop} onContinue={noop} />
    );
    expect(html).toContain('AI Interviewer');
    expect(html).toContain('Câu hỏi');
    expect(html).toContain('Chuyên môn');
    expect(html).toContain('data-role="assistant"');
  });

  it('offers stop/continue on CONFIRM_ABORT only while the session is open', () => {
    const abort = message({ messageType: 'CONFIRM_ABORT', content: 'Bạn muốn dừng?' });
    const open = renderToStaticMarkup(
      <MessageBubble message={abort} isClosed={false} isEnding={false} isSending={false} onConfirmAbort={noop} onContinue={noop} />
    );
    const closed = renderToStaticMarkup(
      <MessageBubble message={abort} isClosed isEnding={false} isSending={false} onConfirmAbort={noop} onContinue={noop} />
    );
    expect(open).toContain('Dừng và nhận báo cáo');
    expect(open).toContain('Tiếp tục phỏng vấn');
    expect(closed).not.toContain('Dừng và nhận báo cáo');
    expect(closed).toContain('Phiên phỏng vấn đã kết thúc');
  });
});

describe('Chat composer', () => {
  const render = (stage: string, compact = false) =>
    renderToStaticMarkup(
      <ChatComposer
        value="abc"
        currentStage={stage}
        isSending={false}
        textareaRef={React.createRef<HTMLTextAreaElement>()}
        compact={compact}
        onChange={noop}
        onKeyDown={noop}
        onSend={noop}
        onQuickReply={noop}
      />
    );

  it('offers the farewell quick reply in CLOSING (engine farewell pattern, no "?")', () => {
    const html = render('CLOSING');
    expect(html).toContain('Tôi không có câu hỏi nào thêm, cảm ơn anh/chị.');
    expect(html).toContain('Đặt câu hỏi cho nhà tuyển dụng');
  });

  it('offers a clarification quick reply elsewhere and hides chips in the coding pane', () => {
    expect(render('DEEP_DIVE')).toContain('Bạn có thể nhắc lại câu hỏi không?');
    expect(render('DEEP_DIVE', true)).not.toContain('nhắc lại câu hỏi');
    expect(render('BEHAVIORAL')).toContain('Bối cảnh → Nhiệm vụ → Hành động → Kết quả');
  });
});

describe('Chat room terminal state and helpers', () => {
  it('summarises the finished session with the report call to action', () => {
    const html = renderToStaticMarkup(
      <ChatClosedFooter endReason="HARD_TIMEOUT" answeredCount={5} onReport={noop} onBack={noop} />
    );
    expect(html).toContain('Đã kết thúc do hết thời gian');
    expect(html).toContain('Bạn đã trả lời 5 lượt');
    expect(html).toContain('Xem báo cáo đánh giá');
  });

  it('scales the timer warning to the session length (3-minute demo is not red at start)', () => {
    expect(getTimerTone(180, 3)).toBe('normal');
    expect(getTimerTone(40, 3)).toBe('low');
    expect(getTimerTone(15, 3)).toBe('critical');
    expect(getTimerTone(600, 25)).toBe('normal');
    expect(getTimerTone(200, 25)).toBe('low');
    expect(getTimerTone(140, 25)).toBe('critical');
  });

  it('shows the backend message without its error code prefix', () => {
    const err = { response: { data: { detail: 'IN_PROGRESS: Câu trả lời trước vẫn đang được xử lý.' } } };
    expect(chatErrorMessage(err, 'fallback')).toBe('Câu trả lời trước vẫn đang được xử lý.');
    expect(chatErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
