import { Room, RoomEvent, type LocalAudioTrack } from "livekit-client";
import { INTERVIEW_MICROPHONE_OPTIONS } from "@/lib/livekitAudio";

export const STT_TEST_TOPIC = "intervia.stt-test";
export type SttTestRoomToken = {
  serverUrl: string; participantToken: string; testId: string; roomName: string; traceEnabled: boolean;
};
export type SttTestEvent = {
  type: "ready" | "interim" | "final" | "stopped";
  testId: string; text?: string; provider?: string; model?: string; elapsedMs?: number;
  traceEnabled?: boolean; traceDelivered?: boolean; status?: string;
};

/** No PCM fallback: a failed LiveKit test must not measure a different pipeline. */
export class LivekitSttClient {
  private room = new Room();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopping = false;
  private closed = false;
  private cancelReady: ((error: Error) => void) | null = null;
  private microphone: LocalAudioTrack | undefined;

  constructor(private onEvent: (event: SttTestEvent) => void, private onError: (error: Error) => void) {}

  async connect(token: SttTestRoomToken) {
    const ready = new Promise<void>((resolve, reject) => {
      this.cancelReady = reject;
      this.timer = setTimeout(() => reject(new Error("LiveKit STT worker did not become ready")), 45_000);
      this.room.on(RoomEvent.DataReceived, (data, participant, _kind, topic) => {
        if (this.closed || topic !== STT_TEST_TOPIC || !participant?.isAgent) return;
        let event: SttTestEvent;
        try { event = JSON.parse(new TextDecoder().decode(data)); } catch { return; }
        if (!event || typeof event !== "object") return;
        if (event.testId !== token.testId) return;
        if (!["ready", "interim", "final", "stopped"].includes(event.type)) return;
        if ((event.type === "interim" || event.type === "final") && typeof event.text !== "string") return;
        if (event.type === "ready") {
          if (this.timer) clearTimeout(this.timer);
          this.timer = null;
          resolve();
        }
        this.onEvent(event);
        if (event.type === "stopped") this.close();
      });
      this.room.on(RoomEvent.Disconnected, () => {
        if (this.closed) return;
        const error = new Error("LiveKit STT connection closed before the final acknowledgement");
        reject(error);
        this.onError(error);
        this.close();
      });
    });
    try {
      await Promise.all([this.room.connect(token.serverUrl, token.participantToken), ready]);
      if (this.closed) throw new Error("STT test was cancelled");
      const publication = await this.room.localParticipant.setMicrophoneEnabled(true, INTERVIEW_MICROPHONE_OPTIONS);
      this.microphone = publication?.audioTrack;
      if (this.closed) throw new Error("STT test was cancelled");
    } catch (error) {
      this.close();
      throw error;
    }
  }

  async stop() {
    if (this.stopping || this.closed) return;
    this.stopping = true;
    try {
      // Keep the room subscribed until the worker flushes its final transcript.
      let statsTimer: ReturnType<typeof setTimeout> | undefined;
      let stats;
      try {
        stats = await Promise.race([
          this.microphone?.getSenderStats().catch(() => undefined),
          new Promise<undefined>((resolve) => { statsTimer = setTimeout(() => resolve(undefined), 500); }),
        ]);
      } finally {
        if (statsTimer) clearTimeout(statsTimer);
      }
      await this.room.localParticipant.setMicrophoneEnabled(false);
      await this.room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "stop", stats: stats ? {
        packets_sent: stats.packetsSent, bytes_sent: stats.bytesSent,
        packets_lost: stats.packetsLost, jitter_seconds: stats.jitter, round_trip_seconds: stats.roundTripTime,
      } : undefined })),
        { reliable: true, topic: STT_TEST_TOPIC });
      if (this.closed) return;
      this.timer = setTimeout(() => {
        this.onError(new Error("Timed out waiting for the final STT transcript"));
        this.close();
      }, 30_000);
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error(String(error)));
      this.close();
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.cancelReady?.(new Error("STT test closed"));
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    void this.room.disconnect().catch(() => undefined); // LiveKit stops the owned microphone track.
  }
}
