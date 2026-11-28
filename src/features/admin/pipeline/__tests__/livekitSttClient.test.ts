import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const room = {
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => { handlers[event] = callback; }),
    connect: vi.fn(), disconnect: vi.fn(),
    localParticipant: { setMicrophoneEnabled: vi.fn(), publishData: vi.fn() },
  };
  return { handlers, room };
});
vi.mock("livekit-client", () => ({
  Room: class { constructor() { return mocks.room; } },
  RoomEvent: { DataReceived: "data", Disconnected: "disconnected" },
}));
import { LivekitSttClient, STT_TEST_TOPIC } from "../services/livekitSttClient";
import { INTERVIEW_MICROPHONE_OPTIONS } from "@/lib/livekitAudio";

const token = { serverUrl: "wss://test", participantToken: "private", roomName: "test", testId: "run-1", traceEnabled: true };
function send(type: string, extra = {}, isAgent = true) {
  mocks.handlers.data(new TextEncoder().encode(JSON.stringify({ type, testId: token.testId, ...extra })),
    { isAgent }, undefined, STT_TEST_TOPIC);
}

describe("admin LiveKit microphone lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.room.connect.mockResolvedValue(undefined);
    mocks.room.disconnect.mockResolvedValue(undefined);
    mocks.room.localParticipant.setMicrophoneEnabled.mockResolvedValue(undefined);
    mocks.room.localParticipant.publishData.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it("waits for the worker, shares interview mic settings and drains the final before disconnect", async () => {
    const events = vi.fn(), errors = vi.fn();
    const client = new LivekitSttClient(events, errors);
    const connect = client.connect(token);
    expect(mocks.room.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
    send("ready", { provider: "qwen", model: "fake" });
    await connect;
    expect(mocks.room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true, INTERVIEW_MICROPHONE_OPTIONS);
    await client.stop();
    expect(mocks.room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
    expect(mocks.room.disconnect).not.toHaveBeenCalled();
    send("final", { text: "last words" });
    send("stopped", { status: "stopped" });
    expect(events.mock.calls.map(([event]) => event.type)).toEqual(["ready", "final", "stopped"]);
    expect(mocks.room.disconnect).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(35_000);
    expect(errors).not.toHaveBeenCalled();
  });

  it("ignores other participants, other test IDs and malformed transcripts", async () => {
    const events = vi.fn();
    const client = new LivekitSttClient(events, vi.fn());
    const connect = client.connect(token);
    send("ready", {}, false);
    send("ready", { testId: "another-run" });
    expect(events).not.toHaveBeenCalled();
    send("ready");
    await connect;
    send("final", { text: 123 });
    expect(events).toHaveBeenCalledOnce();
    client.close();
  });

  it("reports RTP counters separately from audio sample counts", async () => {
    mocks.room.localParticipant.setMicrophoneEnabled.mockResolvedValueOnce({ audioTrack: {
      getSenderStats: vi.fn().mockResolvedValue({ packetsSent: 120, bytesSent: 8000, packetsLost: 2, jitter: 0.01, streamId: "private" }),
    } });
    const client = new LivekitSttClient(vi.fn(), vi.fn());
    const connect = client.connect(token);
    send("ready");
    await connect;
    await client.stop();
    const packet = JSON.parse(new TextDecoder().decode(mocks.room.localParticipant.publishData.mock.calls[0][0]));
    expect(packet.stats).toMatchObject({ packets_sent: 120, packets_lost: 2, bytes_sent: 8000 });
    expect(packet.stats).not.toHaveProperty("streamId");
    client.close();
  });

  it("fails visibly and releases the room if the worker never starts", async () => {
    const client = new LivekitSttClient(vi.fn(), vi.fn());
    const outcome = expect(client.connect(token)).rejects.toThrow("did not become ready");
    await vi.advanceTimersByTimeAsync(45_000);
    await outcome;
    expect(mocks.room.disconnect).toHaveBeenCalledOnce();
    expect(mocks.room.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
  });

  it("does not wait forever after stop and keeps microphone denial from leaking a room", async () => {
    const errors = vi.fn();
    const client = new LivekitSttClient(vi.fn(), errors);
    const connect = client.connect(token);
    send("ready");
    await connect;
    await client.stop();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(errors).toHaveBeenCalledOnce();
    expect(mocks.room.disconnect).toHaveBeenCalledOnce();

    mocks.room.localParticipant.setMicrophoneEnabled.mockRejectedValueOnce(new Error("Permission denied"));
    const second = new LivekitSttClient(vi.fn(), errors);
    const denied = second.connect(token);
    send("ready");
    await expect(denied).rejects.toThrow("Permission denied");
    expect(mocks.room.disconnect).toHaveBeenCalledTimes(2);
  });
});
