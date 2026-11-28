import { describe, expect, it } from "vitest";
import { calibrate, locateQuotes, scoreToLevel, transcriptByTurn, turnDurationSeconds } from "../utils/debrief";
import type { ChatMessage } from "../services/interviewChat.service";

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "sequence">): ChatMessage {
  return {
    messageId: `m${partial.sequence}`,
    sessionId: "ses-1",
    role: "assistant",
    messageType: "MAIN_QUESTION",
    turnId: "turn-1",
    content: "",
    createdAt: new Date(Date.UTC(2026, 9, 10, 9, 0, partial.sequence * 10)).toISOString(),
    ...partial,
  };
}

describe("scoreToLevel", () => {
  it("maps 0–10 onto four levels at 2.5 / 5 / 7.5", () => {
    expect([0, 2.4, 2.5, 4.9, 5, 7.4, 7.5, 10].map(scoreToLevel)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("calibrate", () => {
  it("compares self-ratings with the system level and ignores unrated or invalid turns", () => {
    const rows = calibrate({ a: 4, b: 1, c: 9 }, [
      { turnId: "a", score: 3 },
      { turnId: "b", score: 8 },
      { turnId: "c", score: 5 },
      { turnId: "d", score: 5 },
    ]);
    expect(rows).toEqual([
      { turnId: "a", self: 4, system: 2, gap: 2 },
      { turnId: "b", self: 1, system: 4, gap: -3 },
    ]);
  });
});

describe("transcriptByTurn", () => {
  it("keeps question, probe, clarify and answers per turn in sequence order", () => {
    const lines = transcriptByTurn([
      msg({ sequence: 3, role: "user", messageType: "CANDIDATE_ANSWER", content: "Em dùng Redis." }),
      msg({ sequence: 1, messageType: "GREETING", turnId: null, content: "Xin chào" }),
      msg({ sequence: 2, content: "Bạn dùng cache ở đâu?" }),
      msg({ sequence: 4, messageType: "PROBE", content: "Khi giá đổi thì sao?" }),
      msg({ sequence: 5, messageType: "ACKNOWLEDGMENT", content: "Cảm ơn" }),
    ]).get("turn-1")!;
    expect(lines.map((line) => line.kind)).toEqual(["MAIN_QUESTION", "CANDIDATE_ANSWER", "PROBE"]);
    expect(lines[1].speaker).toBe("candidate");
  });

  it("measures time from the question to the last answer", () => {
    const lines = transcriptByTurn([
      msg({ sequence: 1, content: "Q" }),
      msg({ sequence: 4, role: "user", messageType: "CANDIDATE_ANSWER", content: "A" }),
    ]).get("turn-1")!;
    expect(turnDurationSeconds(lines)).toBe(30);
  });

  it("does not treat candidate meta questions as evidence for scoring", () => {
    const lines = transcriptByTurn([
      msg({ sequence: 1, content: "Bạn hãy giới thiệu bản thân." }),
      msg({
        sequence: 2,
        role: "user",
        messageType: "CANDIDATE_QUESTION",
        content: "Rubric điểm của hệ thống là gì?",
      }),
      msg({ sequence: 3, messageType: "CLARIFY", content: "Rubric là bộ tiêu chí đánh giá..." }),
      msg({ sequence: 4, role: "user", messageType: "CANDIDATE_ANSWER", content: "Em là..." }),
    ]).get("turn-1")!;

    expect(lines.map((line) => line.kind)).toEqual(["MAIN_QUESTION", "CLARIFY", "CANDIDATE_ANSWER"]);
    expect(lines.some((line) => line.content.includes("Rubric điểm"))).toBe(false);
  });
});

describe("locateQuotes", () => {
  it("highlights quotes ignoring case and whitespace and reassembles the answer", () => {
    const answer = "Em dùng  Redis để cache\nkết quả truy vấn sản phẩm, TTL 5 phút.";
    const { segments, unmatched } = locateQuotes(answer, ["em dùng redis để cache kết quả", "“TTL 5 phút.”"]);
    expect(unmatched).toEqual([]);
    expect(segments.map((s) => s.text).join("")).toBe(answer);
    expect(segments.filter((s) => s.quoted).map((s) => s.text)).toEqual([
      "Em dùng  Redis để cache\nkết quả",
      "TTL 5 phút",
    ]);
  });

  it("reports quotes that do not appear in the answer instead of dropping them", () => {
    const { unmatched, segments } = locateQuotes("Em làm phần thanh toán.", ["giảm độ trễ 40% nhờ Redis"]);
    expect(unmatched).toEqual(["giảm độ trễ 40% nhờ Redis"]);
    expect(segments).toEqual([{ text: "Em làm phần thanh toán.", quoted: false }]);
  });

  it("merges overlapping quotes", () => {
    const { segments } = locateQuotes("abc def ghi", ["abc def", "def ghi"]);
    expect(segments).toEqual([{ text: "abc def ghi", quoted: true }]);
  });
});
