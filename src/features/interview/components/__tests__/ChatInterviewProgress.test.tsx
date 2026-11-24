import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  calculateRemainingSeconds,
  ChatStageStepper,
  deriveChatStageProgress,
  getEndReasonLabel,
} from '../ChatInterviewProgress';
import { ChatRoomErrorState, ChatRoomLoadingState } from '../ChatRoomStates';

describe('Chat Interview stage progress', () => {
  const turns = [
    { turnId: 'warm', turnIndex: 0, stage: 'WARM_UP', status: 'ANSWERED' },
    { turnId: 'deep', turnIndex: 1, stage: 'DEEP_DIVE', status: 'ANSWERED' },
    { turnId: 'behavioral', turnIndex: 2, stage: 'BEHAVIORAL', status: 'ASKED' },
  ];

  it('uses the backend stage enum and marks omitted earlier stages as skipped', () => {
    const progress = deriveChatStageProgress({
      currentStage: 'BEHAVIORAL',
      sessionStatus: 'OPEN',
      turns,
    });
    const byStage = Object.fromEntries(progress.stages.map((stage) => [stage.key, stage.state]));

    expect(byStage.WARM_UP).toBe('completed');
    expect(byStage.VALIDATE).toBe('skipped');
    expect(byStage.DEEP_DIVE).toBe('completed');
    expect(byStage.CHALLENGE).toBe('skipped');
    expect(byStage.BEHAVIORAL).toBe('current');
    expect(byStage.CLOSING).toBe('optional');
    expect(byStage.CLOSED).toBe('upcoming');
  });

  it('shows a truthful early-finish state without completing planned future stages', () => {
    const progress = deriveChatStageProgress({
      currentStage: 'DEEP_DIVE',
      sessionStatus: 'CLOSED',
      turns: [
        { turnId: 'warm', turnIndex: 0, stage: 'WARM_UP', status: 'ANSWERED' },
        { turnId: 'deep', turnIndex: 1, stage: 'DEEP_DIVE', status: 'ANSWERED' },
        { turnId: 'behavioral', turnIndex: 2, stage: 'BEHAVIORAL', status: 'PLANNED' },
      ],
    });
    const byStage = Object.fromEntries(progress.stages.map((stage) => [stage.key, stage.state]));

    expect(byStage.WARM_UP).toBe('completed');
    expect(byStage.DEEP_DIVE).toBe('completed');
    expect(byStage.BEHAVIORAL).toBe('skipped');
    expect(byStage.CLOSED).toBe('current');
  });

  it('does not guess when the backend returns an unknown stage', () => {
    const progress = deriveChatStageProgress({
      currentStage: 'NEW_FUTURE_STAGE',
      sessionStatus: 'OPEN',
      turns: [],
    });

    expect(progress.currentStage).toBeNull();
    expect(progress.unknownStage).toBe('NEW_FUTURE_STAGE');
  });

  it('renders a responsive stepper without an X/N question counter', () => {
    const html = renderToStaticMarkup(
      <ChatStageStepper currentStage="BEHAVIORAL" sessionStatus="OPEN" turns={turns} />
    );

    expect(html).toContain('data-stage="BEHAVIORAL"');
    expect(html).toContain('data-state="current"');
    expect(html).toContain('data-stage="VALIDATE" data-state="skipped"');
    expect(html).toContain('overflow-x-auto');
    expect(html).not.toMatch(/(?:Lượt|Câu)\s*\d+\s*\/\s*\d+/i);
  });
});

describe('Chat Interview countdown contract', () => {
  it('counts down from the server remaining-time snapshot', () => {
    expect(
      calculateRemainingSeconds({
        serverRemainingSeconds: 180,
        snapshotAtMs: 1_000,
        nowMs: 6_500,
      })
    ).toBe(175);
  });

  it('falls back to the timezone-aware start timestamp and duration', () => {
    expect(
      calculateRemainingSeconds({
        startedAt: '2026-10-02T10:00:00+07:00',
        durationMinutes: 25,
        snapshotAtMs: 0,
        nowMs: Date.parse('2026-10-02T10:10:00+07:00'),
      })
    ).toBe(900);
  });

  it('never goes negative and hides when the API has no trustworthy timing data', () => {
    expect(
      calculateRemainingSeconds({
        serverRemainingSeconds: 10,
        snapshotAtMs: 0,
        nowMs: 20_000,
      })
    ).toBe(0);
    expect(calculateRemainingSeconds({ snapshotAtMs: 0, nowMs: 10_000 })).toBeNull();
  });
});

describe('Chat Interview terminal and fetch states', () => {
  it('distinguishes normal completion, candidate abort, timeout, fast-fail and system failure', () => {
    expect(getEndReasonLabel('COMPLETED')).toBe('Đã hoàn tất');
    expect(getEndReasonLabel('CANDIDATE_ABORT')).toBe('Đã dừng theo yêu cầu');
    expect(getEndReasonLabel('HARD_TIMEOUT')).toBe('Đã kết thúc do hết thời gian');
    expect(getEndReasonLabel('FAST_FAIL_TECH')).toBe('Phiên đã kết thúc sớm');
    expect(getEndReasonLabel('TECHNICAL_FAILURE')).toBe('Đã dừng do lỗi hệ thống');
  });

  it('renders loading and retryable error states', () => {
    const loadingHtml = renderToStaticMarkup(<ChatRoomLoadingState />);
    const errorHtml = renderToStaticMarkup(
      <ChatRoomErrorState message="Mất kết nối" onRetry={() => undefined} onBack={() => undefined} />
    );

    expect(loadingHtml).toContain('Đang khởi tạo phòng phỏng vấn');
    expect(errorHtml).toContain('Mất kết nối');
    expect(errorHtml).toContain('Thử lại');
  });
});
