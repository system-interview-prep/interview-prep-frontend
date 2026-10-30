/**
 * The notice a candidate sees when an admin listens to their voice/video room.
 *
 * The backend sends one reliable data message on this topic when it issues a
 * hidden, listen-only observer seat (admin/room_observer.announce_observer).
 */
export const OBSERVER_TOPIC = 'intervia.observer';

export type ObserverNotice = { minutes: number };

export function parseObserverNotice(payload: Uint8Array): ObserverNotice | null {
  try {
    const event = JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
    if (event.type !== 'observer_joined') return null;
    const minutes = typeof event.minutes === 'number' && event.minutes > 0 ? event.minutes : 10;
    return { minutes };
  } catch {
    return null;
  }
}
