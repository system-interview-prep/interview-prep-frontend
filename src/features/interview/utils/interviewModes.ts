/**
 * One source for what each interview mode is called and what it does.
 * Every surface (dashboard, select page, CV modal, fit report, history,
 * report) reads names from here so they never drift apart again.
 */
export type InterviewModeKey = "chat" | "voice" | "video";

/** Runtime API mode ("text") → product mode key ("chat"). */
export function modeKeyFromRuntime(mode?: string | null): InterviewModeKey {
  if (mode === "voice") return "voice";
  if (mode === "video") return "video";
  return "chat";
}

/** i18n keys; the dictionaries hold the actual strings for vi and en. */
export const MODE_NAME_KEY: Record<InterviewModeKey, string> = {
  chat: "mode.chat.name",
  voice: "mode.voice.name",
  video: "mode.video.name",
};

export const MODE_DESC_KEY: Record<InterviewModeKey, string> = {
  chat: "mode.chat.desc",
  voice: "mode.voice.desc",
  video: "mode.video.desc",
};

/** The mode recommended for a first session, shown with the same badge everywhere. */
export const RECOMMENDED_MODE: InterviewModeKey = "chat";

/** Session lengths the product actually offers (minutes). */
export const SESSION_DURATIONS = [15, 25, 45] as const;
