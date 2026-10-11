import { describe, expect, it } from 'vitest';
import {
  isVoiceRecoveryUtterance,
  normalizeVoiceTranscript,
  reconcileVoiceTranscript,
} from '../utils/voiceLanguage';

describe('normalizeVoiceTranscript', () => {
  it('shows short Vietnamese acknowledgements instead of English STT artifacts', () => {
    expect(normalizeVoiceTranscript('Yeah.', 'vi-VN', 'user')).toBe('Dạ.');
    expect(normalizeVoiceTranscript('Yeah, yeah.', 'vi-VN', 'user')).toBe('Dạ, dạ.');
  });

  it('does not rewrite real mixed-language answers or English sessions', () => {
    const answer = 'Yeah, em dùng PostgreSQL cho transaction chính.';
    expect(normalizeVoiceTranscript(answer, 'vi-VN', 'user')).toBe(answer);
    expect(normalizeVoiceTranscript('Yeah.', 'en-US', 'user')).toBe('Yeah.');
    expect(normalizeVoiceTranscript('Yeah.', 'vi-VN', 'ai')).toBe('Yeah.');
  });
});

describe('reconcileVoiceTranscript', () => {
  it('replaces an interrupted AI prefix and greeting with the complete replay', () => {
    const previous = [
      { id: 'a1', speaker: 'ai' as const, text: 'Chào bạn, mình là người phỏng vấn vị trí' },
      { id: 'u1', speaker: 'user' as const, text: 'Hello.' },
    ];

    expect(
      reconcileVoiceTranscript(
        previous,
        {
          id: 'a2',
          speaker: 'ai',
          text: 'Chào bạn, mình là người phỏng vấn vị trí Software Engineer, Backend.',
        },
        'vi-VN',
      ),
    ).toEqual([
      {
        id: 'a2',
        speaker: 'ai',
        text: 'Chào bạn, mình là người phỏng vấn vị trí Software Engineer, Backend.',
      },
    ]);
  });

  it('keeps normal candidate turns and joins consecutive final AI clauses', () => {
    const previous = [
      { id: 'u1', speaker: 'user' as const, text: 'Em có ba năm kinh nghiệm.' },
      { id: 'a1', speaker: 'ai' as const, text: 'Bạn hãy mô tả' },
    ];
    expect(
      reconcileVoiceTranscript(
        previous,
        { id: 'a2', speaker: 'ai', text: 'dự án gần nhất nhé?' },
        'vi-VN',
      ),
    ).toEqual([
      previous[0],
      { id: 'a2', speaker: 'ai', text: 'Bạn hãy mô tả dự án gần nhất nhé?' },
    ]);
  });
});

describe('isVoiceRecoveryUtterance', () => {
  it('recognizes greetings and Vietnamese playback complaints', () => {
    expect(isVoiceRecoveryUtterance('Hello.', 'vi-VN')).toBe(true);
    expect(isVoiceRecoveryUtterance('Bị đứt đoạn á.', 'vi-VN')).toBe(true);
    expect(isVoiceRecoveryUtterance('Em có ba năm kinh nghiệm.', 'vi-VN')).toBe(false);
  });
});
