import { apiClient } from "@/lib/apiClient";

/** The interviewer's playbook (interviews/application/interviewer_playbook.py). */
export type PlaybookStep = "all" | "evaluate_answer" | "probe" | "clarify";
export type PlaybookStatus = "PROPOSED" | "ACTIVE" | "RETIRED" | "REJECTED";

export type PlaybookEvidence = { case: string; sessionId?: string | null; turnIndex?: number | null; traceId?: string | null; flags?: string[] | null };

export type PlaybookEntry = {
  id: string;
  step: PlaybookStep;
  skill: string | null;
  text: string;
  status: PlaybookStatus;
  origin: "reflection" | "manual";
  replacesId: string | null;
  helpful: number;
  harmful: number;
  source: { op?: "ADD" | "EDIT" | "RETIRE"; why?: string; cases?: PlaybookEvidence[]; run?: string };
  note: string | null;
  decidedAt: string | null;
  createdAt: string | null;
};

export type PlaybookRun = {
  running: boolean;
  runId?: string;
  days?: number;
  startedAt?: string;
  finishedAt?: string;
  cases?: number;
  used?: number;
  proposed?: number;
  verdicts?: Record<string, number>;
  error?: string | null;
};

export type PlaybookView = { entries: PlaybookEntry[]; version: string; run: PlaybookRun; needsMigration?: boolean };

export const playbookService = {
  async view(): Promise<PlaybookView> {
    const response = await apiClient.get<{ success: boolean } & PlaybookView>("/admin/interviewer-playbook");
    return response.data;
  },
  async reflect(days: number): Promise<PlaybookRun> {
    const response = await apiClient.post<{ success: boolean; run: PlaybookRun }>("/admin/interviewer-playbook/reflect", { days });
    return response.data.run;
  },
  async add(payload: { step: PlaybookStep; text: string; skill?: string }): Promise<void> {
    await apiClient.post("/admin/interviewer-playbook", { ...payload, skill: payload.skill || null });
  },
  async decide(id: string, decision: "APPROVE" | "REJECT" | "RETIRE", extra: { note?: string; text?: string } = {}): Promise<{ version: string }> {
    const response = await apiClient.post<{ success: boolean; version: string }>(
      `/admin/interviewer-playbook/${encodeURIComponent(id)}/decision`,
      { decision, note: extra.note || null, text: extra.text || null },
    );
    return response.data;
  },
};

/** Entries by status, active ones with the most net-helpful first. */
export function groupEntries(entries: PlaybookEntry[]): Record<PlaybookStatus, PlaybookEntry[]> {
  const groups: Record<PlaybookStatus, PlaybookEntry[]> = { PROPOSED: [], ACTIVE: [], RETIRED: [], REJECTED: [] };
  for (const entry of entries) groups[entry.status]?.push(entry);
  groups.ACTIVE.sort((a, b) => b.helpful - b.harmful - (a.helpful - a.harmful));
  return groups;
}
