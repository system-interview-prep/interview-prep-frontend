import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CurrentQuestionCard, questionTimerState } from '../CurrentQuestionCard';
import { presenceState } from '../VoiceRoomParts';

describe('Per-question timer', () => {
  it('stays calm until the suggested time, then asks to wrap up, then flags overtime', () => {
    expect(questionTimerState(60, 150, 180).phase).toBe('answering');
    expect(questionTimerState(160, 150, 180).phase).toBe('wrapUp');
    expect(questionTimerState(200, 150, 180).phase).toBe('over');
  });

  it('fills against the hard limit and marks the suggested time on the bar', () => {
    const state = questionTimerState(90, 150, 180);
    expect(state.fillPercent).toBe(50);
    expect(Math.round(state.softPercent)).toBe(83);
    expect(questionTimerState(999, 150, 180).fillPercent).toBe(100);
  });
});

describe('Interviewer presence', () => {
  it('follows real room signals only', () => {
    expect(presenceState({ agentConnected: false, agentSpeaking: false, turnState: null })).toBe('waiting');
    expect(presenceState({ agentConnected: true, agentSpeaking: true, turnState: 'processing' })).toBe('speaking');
    expect(presenceState({ agentConnected: true, agentSpeaking: false, turnState: 'processing' })).toBe('thinking');
    expect(presenceState({ agentConnected: true, agentSpeaking: false, turnState: 'answering' })).toBe('listening');
  });
});

describe('Current question card', () => {
  it('shows the open follow-up under the main question', () => {
    const html = renderToStaticMarkup(
      <CurrentQuestionCard
        stageLabel="Chuyên môn"
        competency="SQL"
        text="N+1 query là gì?"
        followUpText="Bạn phát hiện nó trong service đang chạy thế nào?"
      />
    );
    expect(html).toContain('Chuyên môn · SQL');
    expect(html).toContain('Câu hỏi đào sâu');
    expect(html).toContain('Bạn phát hiện nó trong service đang chạy thế nào?');
  });

  it('says where the first question will appear before the interviewer starts', () => {
    const html = renderToStaticMarkup(<CurrentQuestionCard stageLabel={null} text={null} />);
    expect(html).toContain('Câu hỏi đầu tiên sẽ hiện ở đây');
  });
});
