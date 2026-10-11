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

  it('clears the warning on recovery and ignores unrelated packets', () => {
    expect(voiceTransportHealthMessage({ type: 'voice.transport.recovered' }, 'vi-VN')).toBeNull();
    expect(voiceTransportHealthMessage({ type: 'other' }, 'vi-VN')).toBeUndefined();
  });
});
