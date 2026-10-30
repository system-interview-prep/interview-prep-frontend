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

  it('shows the Vietnamese call greeting instead of hello', () => {
    expect(normalizeVoiceTranscript('Hello,', 'vi-VN', 'user')).toBe('Alô.');
    expect(normalizeVoiceTranscript('Hello, bạn nghe rõ không?', 'vi-VN', 'user')).toBe('Alô, bạn nghe rõ không?');
    expect(normalizeVoiceTranscript('Yeah, em nghe rõ à?', 'vi-VN', 'user')).toBe('Dạ, em nghe rõ à?');
  });

  it('does not rewrite real mixed-language answers or English sessions', () => {
    // Only the opening filler changes; the answer is kept word for word.
    expect(normalizeVoiceTranscript('Yeah, em dùng PostgreSQL cho transaction chính.', 'vi-VN', 'user')).toBe(
      'Dạ, em dùng PostgreSQL cho transaction chính.',
    );
    expect(normalizeVoiceTranscript('Yes, I used Redis as a cache.', 'vi-VN', 'user')).toBe('Yes, I used Redis as a cache.');
    expect(normalizeVoiceTranscript('Hello, can you hear me?', 'en-US', 'user')).toBe('Hello, can you hear me?');
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

  it('keeps one copy when the agent starts a cut-off line over', () => {
    const previous = [
      { id: 'a1', speaker: 'ai' as const, text: 'Chào Hi, mình là người phỏng vấn AI của Intervia. Hôm nay mình cùng luyện phỏng vấn và' },
    ];
    const replay = {
      id: 'a2',
      speaker: 'ai' as const,
      text: 'Chào Hi, mình là người phỏng vấn AI của Intervia.\n\nHôm nay mình cùng luyện phỏng vấn vị trí Backend.',
    };
    expect(reconcileVoiceTranscript(previous, replay, 'vi-VN')).toEqual([replay]);
  });

  it('starts a new AI bubble when the previous AI paragraph already ended', () => {
    const previous = [{ id: 'a1', speaker: 'ai' as const, text: 'Trả lời xong, bạn chỉ cần nói “xong”. Mình bắt đầu nhé.' }];
    const next = { id: 'a2', speaker: 'ai' as const, text: 'Bạn giới thiệu ngắn về mình nhé?' };
    expect(reconcileVoiceTranscript(previous, next, 'vi-VN')).toEqual([previous[0], next]);
  });
});

describe('isVoiceRecoveryUtterance', () => {
  it('recognizes greetings and Vietnamese playback complaints', () => {
    expect(isVoiceRecoveryUtterance('Hello.', 'vi-VN')).toBe(true);
    expect(isVoiceRecoveryUtterance('Bị đứt đoạn á.', 'vi-VN')).toBe(true);
    expect(isVoiceRecoveryUtterance('Em có ba năm kinh nghiệm.', 'vi-VN')).toBe(false);
  });
});
