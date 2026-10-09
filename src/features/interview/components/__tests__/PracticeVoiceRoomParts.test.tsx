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
import { ControlButton, PreJoinCard, TranscriptPanel, VoiceRoomHeader, voiceStatus } from '../VoiceRoomParts';

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
  it('maps LiveKit status to plain guidance without the vendor name', () => {
    expect(voiceStatus('agent-speaking', true)).toEqual({ label: 'AI đang nói — hãy lắng nghe', tone: 'ai' });
    expect(voiceStatus('connected', true).label).toBe('Đến lượt bạn — hãy trả lời');
    const header = renderToStaticMarkup(
      <VoiceRoomHeader mode="video" jobTitle="Data Engineer" status={voiceStatus('idle', false)} isEnding={false} onBack={noop} onEnd={noop} />
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
    expect(html).toContain('AI Interviewer');
    expect(html).toContain('data-speaker="user"');
    expect(html).toContain('2 lượt');
  });
});
