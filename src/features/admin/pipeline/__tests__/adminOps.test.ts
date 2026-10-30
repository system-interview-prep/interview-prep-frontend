import { describe, expect, it } from "vitest";
import { canClose, canGrade } from "../components/SessionAdminActions";
import { qualityIssues } from "@features/admin/components/QuestionQualityClient";
import { formatConfigValue } from "@features/admin/components/SystemConfigPanel";
import { sessionState } from "@features/admin/components/AdminUserDetailClient";
import { healthFacts } from "@features/admin/components/SystemHealthClient";
import { share, weekLabel } from "@features/admin/components/PracticeStatsClient";
import { detailText, targetHref } from "../components/AccessLogsSection";
import { filterTopics } from "@features/admin/components/AdminHelpClient";
import type { SessionPipeline } from "../services/pipeline.service";
import type { QuestionQualityGroup } from "@features/admin/services/adminOps.service";

const NOW = Date.parse("2026-10-25T10:00:00Z");

function pipeline(status: string, evaluation: Partial<SessionPipeline["evaluation"]> = {}): SessionPipeline {
  return {
    session: { id: "s1", status },
    evaluation: { job: null, evaluatedAt: null, ...evaluation },
  } as unknown as SessionPipeline;
}

function job(status: string, leaseUntil: string | null) {
  return { status, attemptCount: 1, lastError: null, leaseUntil, updatedAt: null };
}

describe("session admin actions", () => {
  it("offers closing only while the session is open", () => {
    expect(canClose(pipeline("ACTIVE"))).toBe(true);
    expect(canClose(pipeline("CLOSED"))).toBe(false);
  });

  it("offers grading for a closed session without a report and no live grading run", () => {
    expect(canGrade(pipeline("ACTIVE"), NOW)).toBe(false);
    expect(canGrade(pipeline("CLOSED"), NOW)).toBe(true);
    expect(canGrade(pipeline("CLOSED", { evaluatedAt: "2026-10-25T09:00:00Z" }), NOW)).toBe(false);
    expect(canGrade(pipeline("CLOSED", { job: job("FAILED", "2026-10-25T09:00:00Z") }), NOW)).toBe(true);
    expect(canGrade(pipeline("CLOSED", { job: job("PROCESSING", "2026-10-25T10:05:00Z") }), NOW)).toBe(false);
    // The grader died: its lease ran out.
    expect(canGrade(pipeline("CLOSED", { job: job("PROCESSING", "2026-10-25T09:55:00Z") }), NOW)).toBe(true);
  });

  it("hides grading when no main question was answered", () => {
    const greetingOnly = { ...pipeline("CLOSED"), turnCounts: { total: 2, warmup: 1, main: 1, gradable: 0 } };
    expect(canGrade(greetingOnly as SessionPipeline, NOW)).toBe(false);
    const answered = { ...pipeline("CLOSED"), turnCounts: { total: 3, warmup: 1, main: 2, gradable: 1 } };
    expect(canGrade(answered as SessionPipeline, NOW)).toBe(true);
  });
});

function group(overrides: Partial<QuestionQualityGroup> = {}): QuestionQualityGroup {
  return {
    stage: "DEEP_DIVE",
    source: "question_bank",
    asked: 10,
    answeredRate: 0.9,
    skippedRate: 0.1,
    meanScore: 6,
    scoreStdDev: 1.5,
    meanAnswerSeconds: 80,
    overHardTimeRate: 0.1,
    probesPerTurn: 0.5,
    llmProbeShare: 0.8,
    unlabelledProbeShare: 0,
    clarifiesPerTurn: 0.1,
    difficultyMatchRate: 1,
    repeatedAcrossSessionsRate: 0,
    duplicateInSessionCount: 0,
    wrongLanguageCount: 0,
    leakCount: 0,
    ...overrides,
  };
}

describe("question quality issues", () => {
  it("passes a healthy group", () => {
    expect(qualityIssues(group())).toEqual([]);
  });

  it("puts content problems first, then rate problems", () => {
    expect(
      qualityIssues(group({ leakCount: 1, wrongLanguageCount: 2, duplicateInSessionCount: 1, skippedRate: 0.4, overHardTimeRate: 0.5, repeatedAcrossSessionsRate: 0.31 })),
    ).toEqual(["leak", "language", "duplicate", "skipped", "overTime", "repeated"]);
  });

  it("flags flat scores only with enough questions", () => {
    expect(qualityIssues(group({ scoreStdDev: 0.2 }))).toEqual(["flatScores"]);
    expect(qualityIssues(group({ scoreStdDev: 0.2, asked: 3 }))).toEqual([]);
  });
});

describe("config values", () => {
  const t = (key: string) =>
    ({
      "adminOps.config.on": "Bật",
      "adminOps.config.off": "Tắt",
      "adminOps.config.set": "Đã cấu hình",
      "adminOps.config.notSet": "Chưa cấu hình",
      "adminOps.config.value.dialect.bac": "Bắc",
    })[key] ?? key;

  it("formats switches, keys, percents and shares", () => {
    expect(formatConfigValue({ key: "speechV2", value: true }, t)).toBe("Bật");
    expect(formatConfigValue({ key: "openaiKey", value: false }, t)).toBe("Chưa cấu hình");
    expect(formatConfigValue({ key: "minMatchPercent", value: 55 }, t)).toBe("55%");
    expect(formatConfigValue({ key: "langfuseTextSampleRate", value: 0.2 }, t)).toBe("20%");
    expect(formatConfigValue({ key: "dialect", value: "bac" }, t)).toBe("Bắc");
    expect(formatConfigValue({ key: "llmModel", value: "gpt-4.1-mini" }, t)).toBe("gpt-4.1-mini");
    expect(formatConfigValue({ key: "llmModel", value: "" }, t)).toBe("—");
  });
});

describe("user detail session state", () => {
  const base = { id: "s", mode: "chat" as const, jobTitle: null, startedAt: null, endedAt: null, endReason: null, durationMinutes: 15 };
  it("separates open, ungraded and graded sessions", () => {
    expect(sessionState({ ...base, status: "ACTIVE", score: null }).key).toBe("open");
    expect(sessionState({ ...base, status: "CLOSED", score: null }).key).toBe("ungraded");
    expect(sessionState({ ...base, status: "CLOSED", score: 7.2 }).key).toBe("graded");
  });
});

describe("system health facts", () => {
  const t = (key: string) =>
    ({
      "adminOps.health.fact.latency": "Phản hồi {ms} ms",
      "adminOps.health.fact.migration": "Migration: {applied} (mới nhất {head})",
      "adminOps.health.fact.rooms": "{rooms} phòng mở, {active} phòng có người",
      "adminOps.health.fact.lastVoice": "Sự kiện voice gần nhất: {when}",
    })[key] ?? key;

  it("describes each check in plain words", () => {
    expect(
      healthFacts({ key: "database", status: "warn", detail: "migration_behind", data: { latencyMs: 12, applied: "0035", head: "0036" }, checkedMs: 5 }, t),
    ).toEqual(["Phản hồi 12 ms", "Migration: 0035 (mới nhất 0036)"]);
    expect(healthFacts({ key: "livekit", status: "ok", detail: null, data: { rooms: 3, activeRooms: 1 }, checkedMs: 5 }, t)).toEqual([
      "3 phòng mở, 1 phòng có người",
    ]);
    expect(healthFacts({ key: "rabbitmq", status: "down", detail: "error", data: { error: "boom" }, checkedMs: 5 }, t)).toEqual(["boom"]);
    expect(healthFacts({ key: "langfuse", status: "warn", detail: "no_llm_connection", data: { llmConnections: [] }, checkedMs: 5 }, t)).toEqual([
      "adminOps.health.fact.noLlmConnection",
    ]);
  });
});

describe("practice labels", () => {
  it("labels a week Monday to Sunday", () => {
    expect(weekLabel("2026-10-26")).toBe("26/10 – 01/11");
  });
  it("prints shares without dividing by zero", () => {
    expect(share(1, 3)).toBe("33%");
    expect(share(0, 0)).toBe("—");
  });
});

describe("action log", () => {
  it("links each action to the page of its object", () => {
    expect(targetHref({ action: "VIEW_CANDIDATE_ANSWER", sessionId: "s1", targetId: "t1" })).toBe("/admin/interviews/s1");
    expect(targetHref({ action: "CHANGE_ROLES", sessionId: null, targetId: "u1" })).toBe("/admin/users/u1");
    expect(targetHref({ action: "PUBLISH_JD", sessionId: null, targetId: "jd1" })).toBe("/admin/job-descriptions/jd1");
    expect(targetHref({ action: "REPARSE_CV", sessionId: null, targetId: "cv1" })).toBe("/admin/cv-parsing/cv1");
    expect(targetHref({ action: "ACTIVATE_TAXONOMY", sessionId: null, targetId: "v3" })).toBe("/admin/taxonomy");
    expect(targetHref({ action: "EDIT_TAXONOMY_CONCEPT", sessionId: null, targetId: "v3" })).toBe("/admin/taxonomy");
    expect(targetHref({ action: "APPROVE_QUESTION", sessionId: null, targetId: "qv1" })).toBeNull();
  });

  it("describes the detail in plain words", () => {
    const t = (key: string) =>
      ({
        "aiPipeline.access.detail.decision": "Kết luận",
        "aiPipeline.access.value.REJECT": "Từ chối",
        "aiPipeline.access.detail.roles": "Vai trò",
        "aiPipeline.access.value.ADMIN": "Quản trị viên",
        "aiPipeline.access.detail.active": "Hoạt động",
        "adminOps.config.off": "Tắt",
      })[key] ?? key;
    expect(detailText({ decision: "REJECT" }, t)).toBe("Kết luận: Từ chối");
    expect(detailText({ roles: ["ADMIN", "CANDIDATE"], active: false, note: null }, t)).toBe(
      "Vai trò: Quản trị viên, CANDIDATE · Hoạt động: Tắt",
    );
    expect(detailText({}, t)).toBe("");
  });
});

describe("help search", () => {
  const texts: Record<string, string> = {
    "adminOps.help.topic.a.title": "CV phân tích lỗi",
    "adminOps.help.topic.a.body": "Mở Xử lý CV",
    "adminOps.help.topic.b.title": "Worker không chạy",
    "adminOps.help.topic.b.body": "docker compose restart worker",
  };
  const t = (key: string) => texts[key] ?? key;
  const topics = [
    { id: "a", links: [] },
    { id: "b", links: [] },
  ];
  it("matches every word, ignoring accents", () => {
    expect(filterTopics(topics, "", t).map((x) => x.id)).toEqual(["a", "b"]);
    expect(filterTopics(topics, "loi cv", t).map((x) => x.id)).toEqual(["a"]);
    expect(filterTopics(topics, "worker restart", t).map((x) => x.id)).toEqual(["b"]);
    expect(filterTopics(topics, "khong ton tai", t)).toEqual([]);
  });
});
