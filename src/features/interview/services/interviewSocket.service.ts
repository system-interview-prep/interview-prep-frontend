import { type Socket } from 'socket.io-client';
import { getSocketClient, disconnectSocketClient } from '@lib/socketClient';

/**
 * Signaling socket – used by useWebRTC for WebRTC offer/answer/ICE relay.
 */
export const signalingService = {
  get socket(): Socket {
    return getSocketClient('/signaling');
  },
  emit(event: string, data?: unknown) { this.socket.emit(event, data); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (...args: any[]) => void) { this.socket.on(event, handler); },
  off(event: string) { this.socket.off(event); },
  disconnect() { disconnectSocketClient('/signaling'); },
};

/**
 * Chat socket – used by useSocket for realtime messaging.
 */
export const chatService = {
  get socket(): Socket {
    return getSocketClient('/chat');
  },
  emit(event: string, data?: unknown) { this.socket.emit(event, data); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (...args: any[]) => void) { this.socket.on(event, handler); },
  off(event: string) { this.socket.off(event); },
  disconnect() { disconnectSocketClient('/chat'); },
};
