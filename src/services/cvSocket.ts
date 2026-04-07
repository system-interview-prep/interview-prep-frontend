import { io, type Socket } from "socket.io-client";
import { CV_SOCKET_EVENTS, SOCKET_URL } from "@/constants";
import type { CvStatusPayload } from "@/types/cvProcessing";

let _cvSocket: Socket | null = null;

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/**
 * Socket.IO `/cv` — cùng host với REST (NEXT_PUBLIC_SOCKET_URL / localhost:5000).
 */
export function getCvSocket(): Socket {
  if (!_cvSocket) {
    _cvSocket = io(`${SOCKET_URL.replace(/\/$/, "")}/cv`, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: readToken() ?? "" },
    });
  }
  return _cvSocket;
}

export function disconnectCvSocket(): void {
  _cvSocket?.disconnect();
  _cvSocket = null;
}

export function emitJoinCv(cvId: string): void {
  const s = getCvSocket();
  s.emit(CV_SOCKET_EVENTS.JOIN_CV, { cvId });
}

export function onCvStatus(handler: (payload: CvStatusPayload) => void): () => void {
  const s = getCvSocket();
  s.on(CV_SOCKET_EVENTS.CV_STATUS, handler);
  return () => {
    s.off(CV_SOCKET_EVENTS.CV_STATUS, handler);
  };
}
