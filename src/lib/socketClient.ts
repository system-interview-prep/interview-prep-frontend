import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants";

function readToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") ?? "";
}

const socketCache = new Map<string, Socket>();

/**
 * Get or create a lazily-initialized Socket.IO connection for any namespace.
 */
export function getSocketClient(namespace: string = ""): Socket {
  const normalizedNs = namespace.startsWith("/") ? namespace : `/${namespace}`;
  const key = normalizedNs === "/" ? "" : normalizedNs;

  if (!socketCache.has(key)) {
    const socket = io(`${SOCKET_URL.replace(/\/$/, "")}${key}`, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: readToken() },
    });
    socketCache.set(key, socket);
  }

  return socketCache.get(key)!;
}

/**
 * Disconnect a specific namespace socket or all active sockets.
 */
export function disconnectSocketClient(namespace?: string): void {
  if (namespace) {
    const normalizedNs = namespace.startsWith("/") ? namespace : `/${namespace}`;
    const key = normalizedNs === "/" ? "" : normalizedNs;
    const socket = socketCache.get(key);
    if (socket) {
      socket.disconnect();
      socketCache.delete(key);
    }
  } else {
    socketCache.forEach((socket) => socket.disconnect());
    socketCache.clear();
  }
}

export default getSocketClient;
