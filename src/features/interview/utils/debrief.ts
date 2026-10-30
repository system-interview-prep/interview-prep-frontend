import type { ChatMessage, ChatMessageType } from "../services/interviewChat.service";

/** Four levels shared by the candidate's self-rating and the system score. */
export type DebriefLevel = 1 | 2 | 3 | 4;

/** i18n keys for the level names; pair with `t()` from useLanguage. */
export const LEVEL_LABEL_KEY: Record<DebriefLevel, string> = {
  1: "level.1",
  2: "level.2",
  3: "level.3",
  4: "level.4",
};

/** Vietnamese level names, kept for non-React callers; UI code should use `t(LEVEL_LABEL_KEY[level])`. */
export const LEVEL_LABELS: Record<DebriefLevel, string> = {
  1: "Còn yếu",
  2: "Tạm được",
  3: "Khá",
  4: "Tốt",
};

/** Map a 0–10 turn score onto the same four levels the candidate rated with. */
export function scoreToLevel(score: number): DebriefLevel {
  if (score >= 7.5) return 4;
  if (score >= 5) return 3;
  if (score >= 2.5) return 2;
  return 1;
}

export interface CalibrationRow {
  turnId: string;
  self: DebriefLevel;
  system: DebriefLevel;
  /** self − system: positive = candidate rated themself higher than the system. */
  gap: number;
}

export function calibrate(
  selfRatings: Record<string, number>,
  turns: Array<{ turnId: string; score: number }>
): CalibrationRow[] {
  return turns
    .filter((turn) => selfRatings[turn.turnId] >= 1 && selfRatings[turn.turnId] <= 4)
    .map((turn) => {
      const self = selfRatings[turn.turnId] as DebriefLevel;
      const system = scoreToLevel(turn.score);
      return { turnId: turn.turnId, self, system, gap: self - system };
    });
}

export interface TranscriptLine {
  messageId: string;
  speaker: "interviewer" | "candidate";
  kind: ChatMessageType;
  content: string;
  createdAt: string;
}

const SHOWN_KINDS = new Set<ChatMessageType>(["MAIN_QUESTION", "PROBE", "CLARIFY", "CANDIDATE_ANSWER"]);

/** Group the question/answer exchange of each turn, in conversation order. */
export function transcriptByTurn(messages: ChatMessage[]): Map<string, TranscriptLine[]> {
  const byTurn = new Map<string, TranscriptLine[]>();
  [...messages]
    .sort((a, b) => a.sequence - b.sequence)
    .forEach((message) => {
      if (!message.turnId) return;
      const kind = message.messageType || (message.role === "user" ? "CANDIDATE_ANSWER" : "MAIN_QUESTION");
      if (!SHOWN_KINDS.has(kind)) return;
      const lines = byTurn.get(message.turnId) ?? [];
      lines.push({
        messageId: message.messageId,
        speaker: message.role === "user" ? "candidate" : "interviewer",
        kind,
        content: message.content,
        createdAt: message.createdAt,
      });
      byTurn.set(message.turnId, lines);
    });
  return byTurn;
}

/** Seconds from the first interviewer line to the candidate's last answer in a turn. */
export function turnDurationSeconds(lines: TranscriptLine[]): number | null {
  const first = lines.find((line) => line.speaker === "interviewer");
  const lastAnswer = [...lines].reverse().find((line) => line.speaker === "candidate");
  if (!first || !lastAnswer) return null;
  const seconds = (Date.parse(lastAnswer.createdAt) - Date.parse(first.createdAt)) / 1000;
  return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : null;
}

export interface QuoteSegment {
  text: string;
  quoted: boolean;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Locate evidence quotes inside the candidate's answer.
 *
 * Matching ignores case and whitespace runs. Quotes that are not found are
 * returned separately so the UI can say the report cites something that does
 * not appear verbatim in the answer, instead of hiding it.
 */
export function locateQuotes(answer: string, quotes: string[]): { segments: QuoteSegment[]; unmatched: string[] } {
  // Build a normalized copy of the answer with a map back to original indices.
  const map: number[] = [];
  let flat = "";
  let previousSpace = true;
  for (let i = 0; i < answer.length; i += 1) {
    const char = answer[i];
    if (/\s/.test(char)) {
      if (previousSpace) continue;
      flat += " ";
      previousSpace = true;
    } else {
      flat += char.toLowerCase();
      previousSpace = false;
    }
    map.push(i);
  }

  const ranges: Array<[number, number]> = [];
  const unmatched: string[] = [];
  for (const quote of quotes) {
    const needle = normalize(quote.replace(/^["“”'…\s]+|["“”'…\s.]+$/g, ""));
    if (needle.length < 3) continue;
    const at = flat.indexOf(needle);
    if (at < 0) {
      unmatched.push(quote);
      continue;
    }
    ranges.push([map[at], map[at + needle.length - 1] + 1]);
  }

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }

  const segments: QuoteSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: answer.slice(cursor, start), quoted: false });
    segments.push({ text: answer.slice(start, end), quoted: true });
    cursor = end;
  }
  if (cursor < answer.length) segments.push({ text: answer.slice(cursor), quoted: false });
  return { segments, unmatched };
}
