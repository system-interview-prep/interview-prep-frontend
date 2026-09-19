import { type Socket } from "socket.io-client";
import { CV_SOCKET_EVENTS } from "@/constants";
import type { CvStatusPayload } from "@features/resume/types";
import { getSocketClient, disconnectSocketClient } from "@lib/socketClient";

export type CvSocketException = {
  code?: string;
  cvId?: string;
  message?: string;
};

export function getCvSocket(): Socket {
  return getSocketClient("/cv");
}

export function disconnectCvSocket(): void {
  disconnectSocketClient("/cv");
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
