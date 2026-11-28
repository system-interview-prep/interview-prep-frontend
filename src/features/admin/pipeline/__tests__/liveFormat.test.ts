import { describe, expect, it } from "vitest";
import { aiPipelineVi } from "@/i18n/dicts/aiPipeline.dict";
import type { AdminAlert, LiveSession, PipelineEvent, PipelineStage, SessionPipeline } from "../services/pipeline.service";
import {
  alertKey,
  alertText,
  boardProgress,
  boardStepLabel,
  endReasonLabel,
  eventDetail,
  fitBandLabel,
  formatClock,
  formatScore,
  liveStateLabel,
  liveStateTone,
  msSince,
  pollInterval,
  questionStageLabel,
  stageSummary,
  voiceIncidentLabel,
} from "../utils/pipelineFormat";

const dict: Record<string, string> = { ...aiPipelineVi, "adminPlan.difficulty.advanced": "Nâng cao" };
const t = (key: string) => dict[key] ?? key;

describe("clocks", () => {
  it("formats running clocks", () => {
    expect(formatClock(7_000)).toBe("0:07");
    expect(formatClock(245_000)).toBe("4:05");
    expect(formatClock(3_729_000)).toBe("1:02:09");
    expect(formatClock(-5)).toBe("0:00");
    expect(formatClock(null)).toBe("—");
  });

  it("measures time since an instant", () => {
    const now = Date.parse("2026-10-19T09:10:00Z");
    expect(msSince("2026-10-19T09:09:30Z", now)).toBe(30_000);
    expect(msSince("2026-10-19T09:11:00Z", now)).toBe(0);
    expect(msSince(null, now)).toBeNull();
    expect(msSince("nope", now)).toBeNull();
  });

  it("polls slowly while the push socket is connected", () => {
    expect(pollInterval({ live: true }, false)).toBe(4000);
    expect(pollInterval({ live: true }, true)).toBe(20_000);
    expect(pollInterval({ live: false }, false)).toBeNull();
  });
});

describe("words instead of codes", () => {
  it("names question stages, fit bands, end reasons and scores", () => {
    expect(questionStageLabel("WARM_UP", t)).toBe("Khởi động");
    expect(questionStageLabel("DEEP_DIVE", t)).toBe("Đào sâu kỹ thuật");
    expect(questionStageLabel("NEW_STAGE", t)).toBe("new stage");
    expect(fitBandLabel("strong_fit", t)).toBe("Phù hợp cao");
    expect(endReasonLabel("HARD_TIMEOUT", t)).toBe("hết giờ");
    expect(formatScore(7.25)).toBe("7.3");
    expect(formatScore(5)).toBe("5");
  });

  it("explains event details in words", () => {
    const event: PipelineEvent = {
      id: 1,
      at: null,
      stage: "interview",
      event: "probe_guardrail_fallback_triggered",
      status: "warning",
      turnIndex: 1,
      durationMs: null,
      payload: { reason: "invalid_or_wrong_language", coverage_ratio: 0.5 },
    };
    expect(eventDetail(event, t)).toBe("Lý do: câu AI viết không hợp lệ hoặc sai ngôn ngữ · Độ phủ: 50%");
    expect(eventDetail(event)).toBe("reason=invalid_or_wrong_language · coverage_ratio=0.5");
  });

  it("describes what the room is doing", () => {
    expect(liveStateLabel({ state: "candidate_speaking" }, t)).toBe("Ứng viên đang nói");
    expect(liveStateLabel({ state: "ai_speaking", kind: "replay" }, t)).toBe("AI đang đọc lại câu hỏi");
    expect(liveStateLabel({ state: "ai_speaking", kind: "unknown" }, t)).toBe("AI đang nói");
    expect(liveStateLabel(null, t)).toBeNull();
    expect(liveStateTone("candidate_away", 0)).toBe("bad");
    expect(liveStateTone("processing", 20_000)).toBe("warn");
    expect(liveStateTone("waiting_answer", 30_000)).toBe("neutral");
    expect(liveStateTone("waiting_answer", 120_000)).toBe("warn");
  });

  it("labels voice incidents with their reason", () => {
    expect(voiceIncidentLabel({ at: null, event: "voice_question_replayed", status: "info", reason: "repeat_request" }, t)).toBe(
      "Đọc lại câu hỏi (ứng viên xin nhắc lại)",
    );
    expect(voiceIncidentLabel({ at: null, event: "voice_not_heard", status: "warning" }, t)).toBe("Không nghe thấy ứng viên");
  });
});

const stage = (key: PipelineStage["key"], status: PipelineStage["status"]): PipelineStage => ({
  key,
  status,
  startedAt: null,
  endedAt: null,
  durationMs: null,
  note: null,
});

const pipeline = {
  entry: { matchPercent: 74, practiceTier: "challenge", blocked: false },
  plan: { targets: [{}, {}, {}], difficulty: { level: "advanced" } },
  turnCounts: { total: 4, warmup: 1, main: 3 },
  questions: { sources: { question_bank: 2, generated_unreviewed: 1, warmup_template: 1 } },
  turns: [{ status: "ANSWERED" }, { status: "ANSWERED" }, { status: "ASKED" }, { status: "PLANNED" }],
  currentTurnIndex: 2,
  session: { endReason: null },
  evaluation: { progress: { graded: 1, total: 4 }, job: null, overallScore: 7.25, decision: "PASS" },
} as unknown as SessionPipeline;

describe("step summaries", () => {
  it("gives each step its result in a few words", () => {
    expect(stageSummary(stage("entry", "done"), pipeline, t)).toBe("74% · Thử thách");
    expect(stageSummary(stage("plan", "done"), pipeline, t)).toBe("3 kỹ năng · Nâng cao");
    expect(stageSummary(stage("questions", "done"), pipeline, t)).toBe("3 câu chính + 1 khởi động · 1 do AI sinh");
    expect(stageSummary(stage("interview", "running"), pipeline, t)).toBe("Đang ở câu 3/4");
    expect(stageSummary(stage("evaluation", "running"), pipeline, t)).toBe("Đã chấm 1/4 câu");
    expect(stageSummary(stage("report", "done"), pipeline, t)).toBe("7.3/10 · Đạt");
    expect(stageSummary(stage("plan", "running"), pipeline, t)).toBeNull();
  });
});

const live = (over: Partial<LiveSession>): LiveSession => ({
  id: "s1",
  candidateName: "An",
  candidateEmail: null,
  jobTitle: "Backend",
  mode: "voice",
  status: "OPEN",
  startedAt: null,
  elapsedMs: null,
  budgetMinutes: 25,
  turns: { total: 4, answered: 2, current: 2, warmup: 1 },
  step: { step: "interviewing", state: "candidate_speaking" },
  warnings: 0,
  errors: 0,
  ackFallbacks: 0,
  lastEventAt: null,
  ...over,
});

describe("live board", () => {
  it("names the step and the question", () => {
    expect(boardStepLabel(live({}).step, t)).toBe("Ứng viên đang nói");
    expect(boardStepLabel({ step: "grading", graded: 2, total: 4 }, t)).toBe("Đang chấm 2/4 câu");
    expect(boardStepLabel({ step: "planning" }, t)).toBe("Đang lập kế hoạch");
    expect(boardProgress(live({}), t)).toBe("Câu 3/4");
    expect(boardProgress(live({ turns: { total: 4, answered: 4, current: null, warmup: 1 } }), t)).toBe("Câu 4/4");
    expect(boardProgress(live({ turns: { total: 0, answered: 0, current: null, warmup: 0 } }), t)).toBeNull();
  });
});

describe("alerts", () => {
  const alert: AdminAlert = {
    kind: "ack_fallback_rate",
    severity: "warning",
    count: 8,
    total: 20,
    rate: 0.4,
    threshold: 0.3,
    minutes: 60,
    sessions: [],
    lastAt: "2026-10-19T09:00:00Z",
  };

  it("phrases alerts with their numbers", () => {
    expect(alertText(alert, t)).toEqual({
      title: "Câu ghi nhận dự phòng 40%",
      detail: "8/20 lượt trong 60 phút qua (ngưỡng 30%).",
    });
  });

  it("keys dismissals by the latest occurrence", () => {
    expect(alertKey(alert)).toBe("ack_fallback_rate@2026-10-19T09:00:00Z");
    expect(alertKey({ ...alert, lastAt: "2026-10-19T09:05:00Z" })).not.toBe(alertKey(alert));
  });

  it("has a title and detail for every alert kind", () => {
    const kinds = [
      "grading_failed",
      "grading_stuck",
      "live_errors",
      "plan_stuck",
      "voice_degraded",
      "interview_idle",
      "ack_fallback_rate",
      "probe_fallback_rate",
      "turn_latency",
      "ai_errors",
    ];
    for (const kind of kinds) {
      expect(dict[`aiPipeline.alert.${kind}.title`], kind).toBeTruthy();
      expect(dict[`aiPipeline.alert.${kind}.detail`], kind).toBeTruthy();
    }
  });
});
