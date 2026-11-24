import type { AudioCaptureOptions } from "livekit-client";

/** The same browser preprocessing in interview and admin microphone tests. */
export const INTERVIEW_MICROPHONE_OPTIONS: AudioCaptureOptions = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
