import { describe, expect, it } from 'vitest';
import { voiceTransportHealthMessage } from '../voiceTransportHealth';

describe('voiceTransportHealthMessage', () => {
  it('shows a Vietnamese pause message while STT retries', () => {
    expect(
      voiceTransportHealthMessage(
        { type: 'voice.transport.degraded', component: 'stt', recoverable: true },
        'vi-VN',
      ),
    ).toContain('nhận diện giọng nói');
  });

  it('distinguishes an unrecoverable provider failure', () => {
    expect(
      voiceTransportHealthMessage(
        { type: 'voice.transport.degraded', component: 'tts', recoverable: false },
        'en-US',
      ),
    ).toContain('unavailable');
  });

  it('asks to wait, not to reconnect, when the connection cap is hit', () => {
    const message = voiceTransportHealthMessage(
      { type: 'voice.transport.degraded', component: 'stt', recoverable: false, reason: 'rate_limited' },
      'vi-VN',
    );
    expect(message).toContain('tạm hết hạn mức');
    expect(message).toContain('chế độ chat');
    expect(message).not.toContain('Hãy kết nối lại');
  });

  it('clears the warning on recovery and ignores unrelated packets', () => {
    expect(voiceTransportHealthMessage({ type: 'voice.transport.recovered' }, 'vi-VN')).toBeNull();
    expect(voiceTransportHealthMessage({ type: 'other' }, 'vi-VN')).toBeUndefined();
  });
});
