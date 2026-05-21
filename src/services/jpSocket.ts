import { io, type Socket } from "socket.io-client";
import { JP_SOCKET_EVENTS, SOCKET_URL } from "@/constants";
import type { JpStatusPayload } from "@/types/jpUpload";

export type JpSocketException = {
  code?: string;
  uploadId?: string;
  message?: string;
};

let _jpSocket: Socket | null = null;

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/** Socket.IO `/jp` — cùng host với REST (NEXT_PUBLIC_SOCKET_URL / localhost:5000). */
export function getJpSocket(): Socket {
  if (!_jpSocket) {
    _jpSocket = io(`${SOCKET_URL.replace(/\/$/, "")}/jp`, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: readToken() ?? "" },
    });
  }
  return _jpSocket;
}

export function disconnectJpSocket(): void {
  _jpSocket?.disconnect();
  _jpSocket = null;
}

export function emitJoinJp(uploadId: string): void {
  const s = getJpSocket();
  s.emit(JP_SOCKET_EVENTS.JOIN_JP, { uploadId });
}

export function onJpStatus(handler: (payload: JpStatusPayload) => void): () => void {
  const s = getJpSocket();
  s.on(JP_SOCKET_EVENTS.JP_STATUS, handler);
  return () => s.off(JP_SOCKET_EVENTS.JP_STATUS, handler);
}

export function onJpSocketException(handler: (payload: JpSocketException) => void): () => void {
  const s = getJpSocket();
  const wrapped = (payload: unknown) => {
    if (!payload || typeof payload !== "object") {
      handler({ message: typeof payload === "string" ? payload : "socket_exception" });
      return;
    }
    const p = payload as Record<string, unknown>;
    handler({
      code: typeof p.code === "string" ? p.code : undefined,
      uploadId: typeof p.uploadId === "string" ? p.uploadId : undefined,
      message: typeof p.message === "string" ? p.message : undefined,
    });
  };
  s.on("exception", wrapped);
  return () => s.off("exception", wrapped);
}

