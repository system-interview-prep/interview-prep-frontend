/**
 * types/index.ts – Shared TypeScript interfaces across the frontend.
 */

export interface User {
  userId: string;
  name: string;
  email: string;
}

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export interface InterviewSession {
  sessionId: string;
  roomId: string;
  userId: string;
  topic: string;
  language: string;
  status: 'idle' | 'connecting' | 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  roomId?: string;
}

export interface RTCSignal {
  from: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
