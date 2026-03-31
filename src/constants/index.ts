/**
 * constants/index.ts
 * App-wide configuration constants.
 */

/** Backend REST API base URL */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Backend Socket.IO server URL */
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

/** WebRTC ICE servers (STUN + optional TURN) */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TODO: Add TURN server for NAT traversal in production
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: process.env.NEXT_PUBLIC_TURN_USER,
  //   credential: process.env.NEXT_PUBLIC_TURN_PASS,
  // },
];

/** Socket.IO event names – keep in sync with BE gateways */
export const SIGNALING_EVENTS = {
  JOIN_ROOM: 'join-room',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  LEAVE_ROOM: 'leave-room',
  PEER_JOINED: 'peer-joined',
  PEER_LEFT: 'peer-left',
} as const;

export const CHAT_EVENTS = {
  JOIN_ROOM: 'join-room',
  SEND_MESSAGE: 'send-message',
  MESSAGE: 'message',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  LEAVE_ROOM: 'leave-room',
} as const;
