import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiClient: { post } }));
import { pipelineService } from "../services/pipeline.service";

describe("standalone admin STT trace contract", () => {
  beforeEach(() => post.mockReset());

  it("requests a separate LiveKit test room instead of creating an interview", async () => {
    post.mockResolvedValue({ data: { testId: "run-3", roomName: "stt-test-run-3", traceEnabled: true } });
    const options = { context: "Backend", referenceText: "Reference for evaluation only" };
    const result = await pipelineService.createSttTestRoom(options);
    expect(post).toHaveBeenCalledWith("/admin/ai/speech/test/livekit-token", options);
    expect(result.roomName).toBe("stt-test-run-3");
  });

  it("sends reference separately from correction context and returns the run ID", async () => {
    post.mockResolvedValue({ data: {
      text: "ASR output", elapsedMs: 80, provider: "qwen", model: "fake", testId: "run-1", traceEnabled: true,
    } });
    const audio = new File([new Uint8Array([0, 0])], "read.wav", { type: "audio/wav" });
    const result = await pipelineService.testSpeechTranscription(audio, {
      context: "Backend Developer", referenceText: "Nhà trường bắt em phải nộp giấy.",
    });
    const [url, form] = post.mock.calls[0];
    expect(url).toBe("/admin/ai/speech/test/transcribe");
    expect(form.get("audio").name).toBe("read.wav");
    expect(form.get("context")).toBe("Backend Developer");
    expect(form.get("referenceText")).toBe("Nhà trường bắt em phải nộp giấy.");
    expect(result.testId).toBe("run-1");
    expect(result.text).toBe("ASR output");
  });

  it("supports testing without a script and preserves the trace-disabled state", async () => {
    post.mockResolvedValue({ data: {
      text: "output", elapsedMs: 20, provider: "qwen", model: "fake", testId: "run-2", traceEnabled: false,
    } });
    const result = await pipelineService.testSpeechTranscription(new File([], "empty.wav"));
    const form = post.mock.calls[0][1] as FormData;
    expect(form.get("context")).toBe("");
    expect(form.get("referenceText")).toBe("");
    expect(result.traceEnabled).toBe(false);
  });
});
