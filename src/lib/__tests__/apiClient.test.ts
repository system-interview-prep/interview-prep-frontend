import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, authApi, interviewApi, userApi } from "../apiClient";

describe("apiClient Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct baseURL and default headers", () => {
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("authApi.login should send POST to /auth/login", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: { access_token: "test-token", user: { id: "1", email: "test@example.com" } },
    });

    const res = await authApi.login("test@example.com", "password123");
    expect(postSpy).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password123",
    });
    expect(res.data.access_token).toBe("test-token");
  });

  it("authApi.register should send POST to /auth/register", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: { access_token: "reg-token", user: { id: "2", email: "reg@example.com" } },
    });

    await authApi.register("Test User", "reg@example.com", "pass123", "0123456789");
    expect(postSpy).toHaveBeenCalledWith("/auth/register", {
      name: "Test User",
      email: "reg@example.com",
      password: "pass123",
      phone: "0123456789",
      role: "CANDIDATE",
    });
  });

  it("interviewApi.start should send POST to /interview/start", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: { id: "interview-101", topic: "React", language: "english" },
    });

    await interviewApi.start("React", "english");
    expect(postSpy).toHaveBeenCalledWith("/interview/start", {
      topic: "React",
      language: "english",
    });
  });

  it("userApi.getProfile should send GET to /user/profile", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: { id: "user-1", email: "user@example.com", name: "Candidate" },
    });

    const res = await userApi.getProfile();
    expect(getSpy).toHaveBeenCalledWith("/user/profile");
    expect(res.data.name).toBe("Candidate");
  });
});
