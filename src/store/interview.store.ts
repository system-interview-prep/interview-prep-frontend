import { create } from 'zustand';

export type InterviewStatus = 'idle' | 'connecting' | 'active' | 'ended';

interface InterviewState {
  sessionId: string | null;
  roomId: string | null;
  topic: string | null;
  language: string;
  status: InterviewStatus;

  setSession: (sessionId: string, roomId: string, topic: string, language: string) => void;
  setStatus: (status: InterviewStatus) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>(set => ({
  sessionId: null,
  roomId: null,
  topic: null,
  language: 'English',
  status: 'idle',

  setSession: (sessionId, roomId, topic, language) =>
    set({ sessionId, roomId, topic, language, status: 'active' }),

  setStatus: (status) => set({ status }),

  reset: () =>
    set({ sessionId: null, roomId: null, topic: null, language: 'English', status: 'idle' }),
}));
