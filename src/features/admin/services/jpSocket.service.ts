import { type Socket } from "socket.io-client";
import { JP_SOCKET_EVENTS } from "@/constants";
import type { JpStatusPayload } from "@features/resume/types";
import { getSocketClient, disconnectSocketClient } from "@lib/socketClient";

export type JpSocketException = {
  code?: string;
  uploadId?: string;
  message?: string;
};

export function getJpSocket(): Socket {
  return getSocketClient("/jp");
}

export function disconnectJpSocket(): void {
  disconnectSocketClient("/jp");
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

