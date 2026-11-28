import { hasScore, type StoredDashboardSession } from "../components/DashboardSections";

export type ScoredDashboardSession = StoredDashboardSession & { overallScore: number };
export type PracticeRoom = "chat" | "voice" | "video";
export type RoomScoreSummary = { average: number | null; count: number };
export type RoomScoreSummaries = Record<PracticeRoom, RoomScoreSummary>;

export type JobResultGroup = {
  jobId: string | null;
  title: string;
  sessions: StoredDashboardSession[];
  scoredSessions: ScoredDashboardSession[];
  scoresByRoom: RoomScoreSummaries;
  latestSession: StoredDashboardSession;
  latestScoredSession: ScoredDashboardSession | null;
  status: "in_progress" | "scored" | "unscored";
};

export type JobResultsOverview = {
  attendedSessions: StoredDashboardSession[];
  jobs: JobResultGroup[];
  jobCount: number;
  scoresByRoom: RoomScoreSummaries;
  scoredSessionCount: number;
  highestScoredSession: ScoredDashboardSession | null;
};

const emptyRoomScores = (): RoomScoreSummaries => ({
  chat: { average: null, count: 0 },
  voice: { average: null, count: 0 },
  video: { average: null, count: 0 },
});

function roomFor(session: StoredDashboardSession): PracticeRoom {
  if (session.mode === "text") return "chat";
  return session.mode;
}

function scoreSummaries(sessions: ScoredDashboardSession[]): RoomScoreSummaries {
  const summaries = emptyRoomScores();
  for (const room of ["chat", "voice", "video"] as const) {
    const roomSessions = sessions.filter((session) => roomFor(session) === room);
    summaries[room] = {
      count: roomSessions.length,
      average: roomSessions.length
        ? roomSessions.reduce((sum, session) => sum + session.overallScore, 0) / roomSessions.length
        : null,
    };
  }
  return summaries;
}

function newestFirst(left: StoredDashboardSession, right: StoredDashboardSession): number {
  return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime();
}

/** A session counts as attended once the candidate has submitted at least one answer. */
export function buildJobResultsOverview(sessions: StoredDashboardSession[]): JobResultsOverview {
  const attendedSessions = sessions.filter((session) => (session.answeredTurns ?? 0) > 0).sort(newestFirst);
  const grouped = new Map<string, StoredDashboardSession[]>();
  for (const session of attendedSessions) {
    const key = session.jobId?.trim() || "__general__";
    const group = grouped.get(key) ?? [];
    group.push(session);
    grouped.set(key, group);
  }

  const jobs = Array.from(grouped, ([key, items]) => {
    const ordered = items.sort(newestFirst);
    const scoredSessions = ordered.filter(hasScore);
    const latestSession = ordered[0];
    return {
      jobId: key === "__general__" ? null : key,
      title: key === "__general__" ? "Phỏng vấn chung" : ordered.find((item) => item.jobTitle?.trim())?.jobTitle?.trim() || "Công việc không còn trong danh sách",
      sessions: ordered,
      scoredSessions,
      scoresByRoom: scoreSummaries(scoredSessions),
      latestSession,
      latestScoredSession: scoredSessions[0] ?? null,
      status: ordered.some((item) => item.status !== "CLOSED")
        ? "in_progress" as const
        : scoredSessions.length
          ? "scored" as const
          : "unscored" as const,
    };
  }).sort((left, right) => right.sessions.length - left.sessions.length || newestFirst(left.latestSession, right.latestSession));

  const scored = attendedSessions.filter(hasScore);
  return {
    attendedSessions,
    jobs,
    jobCount: jobs.filter((job) => job.jobId !== null).length,
    scoresByRoom: scoreSummaries(scored),
    scoredSessionCount: scored.length,
    highestScoredSession: scored.reduce<ScoredDashboardSession | null>(
      (highest, session) => !highest || session.overallScore > highest.overallScore ? session : highest,
      null,
    ),
  };
}
