import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  default: {
    get,
    post,
  },
}));

import { interviewChatApi } from "../interviewChat.service";

describe("interviewChatApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls start chat endpoint", async () => {
    const mockRuntime = {
      sessionId: "session-1",
      sessionStatus: "OPEN",
      experienceType: "interview_chat",
      messages: [],
    };
    post.mockResolvedValueOnce({ data: mockRuntime });

    const res = await interviewChatApi.start("session-1");
    expect(post).toHaveBeenCalledWith("/api/v1/interviews/sessions/session-1/chat/start");
    expect(res.sessionId).toBe("session-1");
  });

  it("calls getRuntime endpoint", async () => {
    const mockRuntime = {
      sessionId: "session-1",
      sessionStatus: "OPEN",
      messages: [{ messageId: "msg-1", role: "assistant", content: "Hello" }],
    };
    get.mockResolvedValueOnce({ data: mockRuntime });

    const res = await interviewChatApi.getRuntime("session-1");
    expect(get).toHaveBeenCalledWith("/api/v1/interviews/sessions/session-1/chat/runtime");
    expect(res.messages).toHaveLength(1);
  });

  it("calls sendMessage endpoint", async () => {
    const mockReply = {
      userMessage: { messageId: "msg-user-1", content: "My answer" },
      assistantResponse: { messageId: "msg-asst-1", content: "Follow-up question" },
      turnStatus: { isFollowUp: true, completed: false },
      sessionStatus: "OPEN",
    };
    post.mockResolvedValueOnce({ data: mockReply });

    const res = await interviewChatApi.sendMessage("session-1", {
      clientMessageId: "cli-123",
      content: "My answer",
    });
    expect(post).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session-1/chat/message",
      {
        clientMessageId: "cli-123",
        content: "My answer",
      }
    );
    expect(res.assistantResponse.content).toBe("Follow-up question");
  });

  it("calls complete endpoint", async () => {
    const mockComplete = {
      sessionId: "session-1",
      sessionStatus: "CLOSED",
      endedAt: "2026-09-25T13:00:00Z",
      summary: "Completed",
    };
    post.mockResolvedValueOnce({ data: mockComplete });

    const res = await interviewChatApi.complete("session-1", "USER_ENDED");
    expect(post).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session-1/chat/complete",
      { reason: "USER_ENDED" }
    );
    expect(res.sessionStatus).toBe("CLOSED");
  });
});
