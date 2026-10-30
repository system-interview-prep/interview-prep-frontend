import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatReturnModal } from '../ChatReturnModal';
import { endReasonKey, getEndReasonLabel } from '../ChatInterviewProgress';

describe('Chat room presence', () => {
  it('welcomes a returning candidate and states the grace period', () => {
    const html = renderToStaticMarkup(
      <ChatReturnModal awaySince="2026-10-20T02:05:00+00:00" graceMinutes={5} onContinue={() => undefined} />
    );
    expect(html).toContain('Chào mừng bạn quay lại buổi phỏng vấn');
    expect(html).toContain('quá 5 phút');
    expect(html).toContain('Tiếp tục phỏng vấn');
    expect(html).toContain('role="dialog"');
  });

  it('names the new end reason', () => {
    expect(endReasonKey('CANDIDATE_LEFT')).toBe('endReason.candidateLeft');
    expect(getEndReasonLabel('CANDIDATE_LEFT')).toBe('Kết thúc do bạn rời phòng');
  });
});

describe('Interview clock before the first question', () => {
  it('shows the full budget standing still', async () => {
    const { InterviewCountdownTimer } = await import('../ChatInterviewProgress');
    const html = renderToStaticMarkup(<InterviewCountdownTimer startedAt={null} durationMinutes={25} isClosed={false} />);
    expect(html).toContain('25:00');
    expect(html).toContain('bắt đầu tính khi có câu hỏi đầu tiên');
  });
});
