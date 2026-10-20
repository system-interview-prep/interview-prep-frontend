/**
 * Vi, the fox in the corner, is a guide rather than a chatbot: it shows where
 * the candidate is on the journey (CV → role → interview → report) and what
 * the system has just done for them. This file turns the candidate's data
 * into that picture. Pure, so it can be tested without the app.
 */
import type { CvProcessingStatus } from "@features/resume/types";
import { cvViewState, processingStep } from "@features/resume/utils/cvStatus";

export type ViStepKey = "cv" | "job" | "interview" | "report";
export type ViStepState = "done" | "current" | "todo";

export interface ViStep {
  key: ViStepKey;
  state: ViStepState;
  href: string;
}

export type ViEventKind = "cvFailed" | "openSession" | "reportReady" | "cvReady" | "cvProcessing";

export interface ViEvent {
  /** Stable per event, so each one is announced once. */
  id: string;
  kind: ViEventKind;
  href: string;
  /** File name or job title the line talks about. */
  subject: string;
  /** cvProcessing: 1-based step of 3. */
  step?: number;
  mode?: "text" | "voice" | "video";
}

export type ViStatus = "error" | "open" | "busy" | "todo" | "done";

export interface ViJourney {
  steps: ViStep[];
  current: ViStep | null;
  /** Newest first by priority: what needs the candidate most comes first. */
  events: ViEvent[];
  status: ViStatus;
  /** Things waiting for the candidate (the badge on the launcher). */
  pending: number;
}

export interface ViCv {
  id: string;
  originalName: string;
  status?: CvProcessingStatus;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ViSession {
  sessionId: string;
  jobTitle?: string | null;
  mode: "text" | "voice" | "video";
  status: string;
  experienceType?: string;
  startedAt?: string;
  endedAt?: string | null;
  endReason?: string | null;
  overallScore?: number | null;
  evaluatedAt?: string | null;
  answeredTurns?: number;
}

export interface ViInput {
  /** Newest first. */
  cvs: ViCv[];
  savedJobCount: number;
  sessions: ViSession[];
  /** Session ids whose report the candidate has opened. */
  seenReports: ReadonlySet<string>;
  now?: number;
}

/** A finished CV is news for this long after it finished. */
export const CV_READY_FRESH_MS = 30 * 60 * 1000;
/** A report nobody opened is still news for this long. */
export const REPORT_FRESH_MS = 3 * 24 * 60 * 60 * 1000;

const PRIORITY: Record<ViEventKind, number> = {
  cvFailed: 0,
  openSession: 1,
  reportReady: 2,
  cvReady: 3,
  cvProcessing: 4,
};

function isFailedStart(session: ViSession): boolean {
  return session.endReason === "TECHNICAL_FAILURE";
}

function isClosed(session: ViSession): boolean {
  return String(session.status).toUpperCase() === "CLOSED";
}

function roomHref(session: ViSession): string {
  if (session.experienceType === "question_practice") return `/practice/room/${session.sessionId}`;
  return `/interview/room/${session.sessionId}`;
}

function age(iso: string | null | undefined, now: number): number {
  const at = Date.parse(iso ?? "");
  return Number.isFinite(at) ? now - at : Number.POSITIVE_INFINITY;
}

export function buildViJourney(input: ViInput): ViJourney {
  const now = input.now ?? Date.now();
  const latestCv = input.cvs[0] ?? null;
  const hasReadyCv = input.cvs.some((cv) => cv.status === "DONE");
  const practised = input.sessions.filter((s) => isClosed(s) && !isFailedStart(s));
  const graded = practised.filter((s) => s.overallScore != null);
  const latestGraded = graded[0] ?? null;

  const done: Record<ViStepKey, boolean> = {
    cv: hasReadyCv,
    job: input.savedJobCount > 0 || input.sessions.length > 0,
    interview: practised.length > 0,
    report: graded.some((s) => input.seenReports.has(s.sessionId)),
  };
  const hrefs: Record<ViStepKey, string> = {
    cv: "/dashboard/cvs",
    job: "/dashboard/jobs",
    interview: "/interview/select",
    report: latestGraded ? `/interview/results/${latestGraded.sessionId}` : "/dashboard/history",
  };
  const order: ViStepKey[] = ["cv", "job", "interview", "report"];
  const firstOpen = order.find((key) => !done[key]) ?? null;
  const steps: ViStep[] = order.map((key) => ({
    key,
    href: hrefs[key],
    state: done[key] ? "done" : key === firstOpen ? "current" : "todo",
  }));
  const current = steps.find((step) => step.state === "current") ?? null;

  const events: ViEvent[] = [];
  if (latestCv) {
    const view = cvViewState(latestCv, now);
    const subject = latestCv.originalName;
    if (view === "failed") {
      events.push({ id: `cv-failed:${latestCv.id}`, kind: "cvFailed", href: "/dashboard/cvs", subject });
    } else if (view === "processing" || view === "slow") {
      events.push({
        id: `cv-processing:${latestCv.id}`,
        kind: "cvProcessing",
        href: "/dashboard/cvs",
        subject,
        step: processingStep(latestCv.status),
      });
    } else if (age(latestCv.updatedAt ?? latestCv.createdAt, now) <= CV_READY_FRESH_MS) {
      events.push({ id: `cv-ready:${latestCv.id}`, kind: "cvReady", href: "/dashboard/cvs", subject });
    }
  }
  // A started interview that is still open: the candidate left the room.
  const open = input.sessions.find((s) => !isClosed(s) && (s.answeredTurns ?? 0) > 0);
  if (open) {
    events.push({
      id: `open:${open.sessionId}`,
      kind: "openSession",
      href: roomHref(open),
      subject: open.jobTitle ?? "",
      mode: open.mode,
    });
  }
  const freshReport = graded.find(
    (s) => !input.seenReports.has(s.sessionId) && age(s.evaluatedAt ?? s.endedAt, now) <= REPORT_FRESH_MS,
  );
  if (freshReport) {
    events.push({
      id: `report:${freshReport.sessionId}`,
      kind: "reportReady",
      href: `/interview/results/${freshReport.sessionId}`,
      subject: freshReport.jobTitle ?? "",
      mode: freshReport.mode,
    });
  }
  events.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]);

  const kinds = new Set(events.map((event) => event.kind));
  const status: ViStatus = kinds.has("cvFailed")
    ? "error"
    : kinds.has("openSession")
      ? "open"
      : kinds.has("cvProcessing")
        ? "busy"
        : events.length || current
          ? "todo"
          : "done";
  const actionable = events.filter((event) => event.kind !== "cvProcessing").length;
  const pending = actionable || (current && !kinds.has("cvProcessing") ? 1 : 0);

  return { steps, current, events, status, pending };
}

/** Which route a results page belongs to, so opening it marks that report seen. */
export function reportIdFromPath(path: string): string | null {
  const match = /^\/interview\/results\/([^/?#]+)/.exec(path);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Fills {name} placeholders in a dictionary line. */
export function fillLine(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}

/** Pages where the signed-in candidate's journey replaces the page tips. */
export function isWorkspacePath(path: string): boolean {
  return /^\/(dashboard|interview|practice)(\/|$)/.test(path);
}
