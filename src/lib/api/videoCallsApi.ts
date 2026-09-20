import api from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoCallStatus = 'ACTIVE' | 'ENDED';

export type VideoCall = {
  id: string;
  sessionId: string;
  status: VideoCallStatus;
  startedAt: string;
  endedAt: string | null;
  roomId: string;
};

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Video Calls API – Khớp với BE module `video_calls`
 *
 * Endpoints (đã có trong aiService.ts):
 *   POST /interview/video-calls/start        → startVideoCall()
 *   POST /interview/video-calls/{id}/end     → endVideoCall()
 *   POST /interview/video-calls/{id}/chat-voice → sendVideoCallVoiceChatMessage()
 *
 * Endpoint mới (chưa có trong FE):
 *   GET  /interview/video-calls              → list()
 */
export const videoCallsApi = {
  /**
   * Lấy danh sách video calls của user hiện tại (tối đa 100, mới nhất trước).
   */
  list: () =>
    api.get<VideoCall[]>('/interview/video-calls'),
};
