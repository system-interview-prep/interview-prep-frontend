import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';

/**
 * socket.ts – Socket.IO client singletons for /signaling and /chat namespaces.
 * Both sockets are created lazily and reused across the app.
 */

let _signalingSocket: Socket | null = null;
let _chatSocket: Socket | null = null;

function getSocket(namespace: string): Socket {
  return io(`${SOCKET_URL}${namespace}`, {
    autoConnect: true,
    transports: ['websocket'],
  });
}

/**
 * Signaling socket – used by useWebRTC for WebRTC offer/answer/ICE relay.
 */
export const signalingService = {
  get socket(): Socket {
    if (!_signalingSocket) {
      _signalingSocket = getSocket('/signaling');
    }
    return _signalingSocket;
  },
  emit(event: string, data?: any) { this.socket.emit(event, data); },
  on(event: string, handler: (...args: any[]) => void) { this.socket.on(event, handler); },
  off(event: string) { this.socket.off(event); },
  disconnect() { _signalingSocket?.disconnect(); _signalingSocket = null; },
};

/**
 * Chat socket – used by useSocket for realtime messaging.
 */
export const chatService = {
  get socket(): Socket {
    if (!_chatSocket) {
      _chatSocket = getSocket('/chat');
    }
    return _chatSocket;
  },
  emit(event: string, data?: any) { this.socket.emit(event, data); },
  on(event: string, handler: (...args: any[]) => void) { this.socket.on(event, handler); },
  off(event: string) { this.socket.off(event); },
  disconnect() { _chatSocket?.disconnect(); _chatSocket = null; },
};
