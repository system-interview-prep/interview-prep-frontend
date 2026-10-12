import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { InterviewFrozenTurn } from '../../services/interviewRuntime.service';
import {
  PracticeHeader,
  PracticeQuestionCard,
  PracticeSidebar,
  PracticeTurnStepper,
  practiceTurnState,
} from '../PracticeRoomParts';
import {
  ControlButton,
  PreJoinCard,
  SpeakerCard,
  StageAlert,
  TranscriptPanel,
  VoiceRoomHeader,
  voiceStatus,
} from '../VoiceRoomParts';

const turn = (index: number, status: string, overrides: Partial<InterviewFrozenTurn['question']> = {}): InterviewFrozenTurn => ({
  turnId: `t${index}`,
  turnIndex: index,
  status,
  questionVersionId: null,
  rubricVersionId: null,
  question: { questionText: `Câu hỏi bí mật ${index}`, ...overrides },
});

const turns = [turn(0, 'ANSWERED'), turn(1, 'ASKED'), turn(2, 'PLANNED')];
const noop = () => undefined;

describe('Practice room parts', () => {
  it('derives answered / current / locked turn states', () => {
    expect(practiceTurnState(turns[0], 't1')).toBe('answered');
    expect(practiceTurnState(turns[1], 't1')).toBe('current');
    expect(practiceTurnState(turns[2], 't1')).toBe('locked');
  });

  it('gives mobile a question stepper that keeps planned questions locked', () => {
    const html = renderToStaticMarkup(
      <PracticeTurnStepper turns={turns} currentTurnId="t1" selectedTurnId="t1" onSelect={noop} />
    );
    expect(html).toContain('lg:hidden');
    expect(html).toMatch(/data-state="locked" disabled=""/);
    expect(html).toContain('aria-current="step"');
    // Stepper shows numbers only, never question text.
    expect(html).not.toContain('Câu hỏi bí mật');
  });

  it('does not reveal planned question text in the sidebar', () => {
    const html = renderToStaticMarkup(
      <PracticeSidebar turns={turns} currentTurnId="t1" selectedTurnId="t1" onSelect={noop} />
    );
    expect(html).toContain('Câu hỏi bí mật 0');
    expect(html).toContain('Câu hỏi bí mật 1');
    expect(html).not.toContain('Câu hỏi bí mật 2');
    expect(html).toContain('Cách luyện tập');
  });

  it('labels the question with Vietnamese type/difficulty and a matching answer tip', () => {
    const html = renderToStaticMarkup(
      <PracticeQuestionCard turn={turn(1, 'ASKED', { questionType: 'BEHAVIORAL', difficulty: 'advanced' })} total={3} />
    );
    expect(html).toContain('Câu hỏi 2 / 3');
    expect(html).toContain('Hành vi');
    expect(html).toContain('Nâng cao');
    expect(html).toContain('STAR');
  });

  it('shows progress in the header on every screen size', () => {
    const html = renderToStaticMarkup(
      <PracticeHeader jobTitle="Backend Engineer" isClosed={false} answered={1} total={3} onBack={noop} onEnd={noop} />
    );
    expect(html).toContain('1/3');
    expect(html).toContain('aria-valuenow="33"');
    expect(html).toContain('Kết thúc');
  });
});

describe('Voice room parts', () => {
  it('shows the agent answer window between speakers', () => {
    expect(voiceStatus('connected', true, undefined, 'processing')).toEqual({
      label: 'Đang xem câu trả lời của bạn...',
      tone: 'wait',
    });
    expect(voiceStatus('connected', true, undefined, 'answering').label).toBe(
      'Đang nghe câu trả lời của bạn',
    );
    expect(voiceStatus('connected', true, undefined, 'listening').label).toBe('Đến lượt bạn — hãy trả lời');
    // Live speech wins over the window state.
    expect(voiceStatus('agent-speaking', true, undefined, 'processing').tone).toBe('ai');
  });

  it('maps LiveKit status to plain guidance without the vendor name', () => {
    expect(voiceStatus('agent-speaking', true)).toEqual({ label: 'AI đang nói — hãy lắng nghe', tone: 'ai' });
    expect(voiceStatus('connected', true).label).toBe('Đến lượt bạn — hãy trả lời');
    const header = renderToStaticMarkup(
      <VoiceRoomHeader mode="video" jobTitle="Data Engineer" status={voiceStatus('idle', false)} onBack={noop} />
    );
    expect(header).toContain('Phỏng vấn giọng nói + camera');
    expect(header).not.toContain('LiveKit');
  });

  it('offers one start CTA before connecting and a retry with the error after a failure', () => {
    const idle = renderToStaticMarkup(<PreJoinCard mode="voice" status="idle" onConnect={noop} />);
    expect(idle).toContain('Bắt đầu phỏng vấn');
    expect(idle).not.toContain('LiveKit');
    const failed = renderToStaticMarkup(
      <PreJoinCard mode="voice" status="error" error="Không lấy được token" onConnect={noop} />
    );
    expect(failed).toContain('Thử kết nối lại');
    expect(failed).toContain('Không lấy được token');
  });

  it('marks a muted control as not pressed', () => {
    const html = renderToStaticMarkup(<ControlButton label="Bật micro" onClick={noop} active={false} icon={null} />);
    expect(html).toContain('aria-pressed="false"');
  });

  it('treats labelled actions such as "Trả lời xong" as buttons, not toggles', () => {
    const html = renderToStaticMarkup(
      <ControlButton label="Tôi đã trả lời xong" text="Trả lời xong" onClick={noop} active primary icon={null} />
    );
    expect(html).not.toContain('aria-pressed');
    expect(html).toContain('Trả lời xong');
  });

  it('puts a speech outage on the stage with a way out', () => {
    const html = renderToStaticMarkup(
      <StageAlert
        title="Người phỏng vấn tạm không nghe được bạn"
        message="Dịch vụ nhận giọng nói đang tạm hết hạn mức."
        action={{ label: 'Rời phòng', onClick: noop }}
      />
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Rời phòng');
    const card = renderToStaticMarkup(
      <SpeakerCard name="Bạn" tone="user" active={false} alert note="Chưa nghe được bạn" icon={null} />
    );
    expect(card).toContain('Chưa nghe được bạn');
  });

  it('renders transcript lines as AI / candidate bubbles', () => {
    const html = renderToStaticMarkup(
      <TranscriptPanel
        agentConnected
        lines={[
          { id: '1', speaker: 'ai', text: 'Giới thiệu bản thân.' },
          { id: '2', speaker: 'user', text: 'Tôi là backend dev.' },
        ]}
      />
    );
    expect(html).toContain('data-speaker="ai"');
    expect(html).toContain('Người phỏng vấn AI');
    expect(html).toContain('data-speaker="user"');
    expect(html).not.toContain('lượt');
  });

  it('shows the answer in progress as the last transcript bubble instead of the empty state', () => {
    const html = renderToStaticMarkup(<TranscriptPanel agentConnected lines={[]} liveText="Em đang làm backend" />);
    expect(html).toContain('data-live="true"');
    expect(html).toContain('Em đang làm backend');
    expect(html).not.toContain('Lời thoại sẽ hiện');
  });
});
