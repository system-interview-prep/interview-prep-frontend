import { io, type Socket } from "socket.io-client";
import { CV_SOCKET_EVENTS, SOCKET_URL } from "@/constants";
import type { CvStatusPayload } from "@/types/cvProcessing";

export type CvSocketException = {
  code?: string;
  cvId?: string;
  message?: string;
};

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

export function onCvSocketException(handler: (payload: CvSocketException) => void): () => void {
  const s = getCvSocket();
  const wrapped = (payload: unknown) => {
    if (!payload || typeof payload !== "object") {
      handler({ message: typeof payload === "string" ? payload : "socket_exception" });
      return;
    }
    const p = payload as Record<string, unknown>;
    handler({
      code: typeof p.code === "string" ? p.code : undefined,
      cvId: typeof p.cvId === "string" ? p.cvId : undefined,
      message: typeof p.message === "string" ? p.message : undefined,
    });
  };
  s.on("exception", wrapped);
  return () => {
    s.off("exception", wrapped);
  };
}
