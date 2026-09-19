import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDisconnect = vi.fn();
const mockSocket = {
  disconnect: mockDisconnect,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

import { getSocketClient, disconnectSocketClient } from "../socketClient";
import { io } from "socket.io-client";

describe("socketClient Singleton Manager", () => {
  beforeEach(() => {
    disconnectSocketClient(); // Clear map state in socketClient
    vi.clearAllMocks();
  });

  it("should create a new socket connection if namespace is requested for the first time", () => {
    const socket = getSocketClient("interview");
    expect(io).toHaveBeenCalledTimes(1);
    expect(socket).toBe(mockSocket);
  });

  it("should return the cached socket instance on subsequent calls for the same namespace", () => {
    const socket1 = getSocketClient("/interview");
    const socket2 = getSocketClient("interview");
    expect(io).toHaveBeenCalledTimes(1);
    expect(socket1).toBe(socket2);
  });

  it("should create separate sockets for different namespaces", () => {
    getSocketClient("interview");
    getSocketClient("jp");
    expect(io).toHaveBeenCalledTimes(2);
  });

  it("should disconnect a specific namespace socket", () => {
    getSocketClient("interview");
    disconnectSocketClient("interview");
    expect(mockDisconnect).toHaveBeenCalledTimes(1);

    mockDisconnect.mockClear();
    vi.clearAllMocks();

    // Requesting again should create a new connection
    getSocketClient("interview");
    expect(io).toHaveBeenCalledTimes(1);
  });

  it("should disconnect all active sockets when called with no arguments", () => {
    getSocketClient("interview");
    getSocketClient("jp");
    disconnectSocketClient();
    expect(mockDisconnect).toHaveBeenCalledTimes(2);
  });
});
