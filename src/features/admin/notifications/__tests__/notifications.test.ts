import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiPipelineVi } from "@/i18n/dicts/aiPipeline.dict";

const list = vi.fn();
const markReadApi = vi.fn();
const post = vi.fn();

vi.mock("@/lib/api/notificationsApi", () => ({
  notificationsApi: { list: (...args: unknown[]) => list(...args), markRead: (...args: unknown[]) => markReadApi(...args) },
}));
vi.mock("@/lib/apiClient", () => ({ default: { post: (...args: unknown[]) => post(...args) } }));
vi.mock("@features/admin/pipeline/hooks/usePipelineSocket", () => ({ useNotificationPush: () => ({ connected: false }) }));

const row = (id: string, read = false, severity = "error") => ({
  id,
  type: "admin.ai_alert",
  title: `Chấm điểm lỗi · ${id}`,
  message: "Backend: chưa có báo cáo",
  data: { severity, link: `/admin/interviews/${id}` },
  read,
  readAt: null,
  createdAt: "2026-10-19T08:00:00Z",
});

describe("admin notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    list.mockReset();
    markReadApi.mockReset();
    post.mockReset();
  });

  it("pops up only notifications that arrive after the first load", async () => {
    const store = await import("../useAdminNotifications");
    list.mockResolvedValueOnce({ data: { items: [row("s1")] } });
    await store.load();
    expect(store.notificationsSnapshot().items).toHaveLength(1);
    expect(store.notificationsSnapshot().toasts).toEqual([]);

    list.mockResolvedValueOnce({ data: { items: [row("s2"), row("s1"), row("s0", true)] } });
    await store.load();
    expect(store.notificationsSnapshot().toasts.map((toast) => toast.id)).toEqual(["s2"]);
    expect(store.notificationsSnapshot().toasts[0]).toMatchObject({ severity: "error", link: "/admin/interviews/s2" });

    store.dismissToast("s2");
    expect(store.notificationsSnapshot().toasts).toEqual([]);
  });

  it("marks one or all as read, optimistically", async () => {
    const store = await import("../useAdminNotifications");
    list.mockResolvedValueOnce({ data: { items: [row("a"), row("b")] } });
    await store.load();
    markReadApi.mockResolvedValue({});
    await store.markRead("a");
    expect(markReadApi).toHaveBeenCalledWith("a");
    expect(store.notificationsSnapshot().items.filter((item) => !item.read).map((item) => item.id)).toEqual(["b"]);
    post.mockResolvedValue({});
    await store.markAllRead();
    expect(post).toHaveBeenCalledWith("/notifications/read-all");
    expect(store.notificationsSnapshot().items.every((item) => item.read)).toBe(true);
  });

  it("reads links and severities defensively", async () => {
    const { linkOf, severityOf } = await import("../useAdminNotifications");
    expect(linkOf({ data: { link: "/admin/ai" } })).toBe("/admin/ai");
    expect(linkOf({ data: { link: "https://evil.example" } })).toBeNull();
    expect(severityOf({ data: { severity: "warning" } })).toBe("warning");
    expect(severityOf({ data: {} })).toBe("info");
  });

  it("says how long ago", async () => {
    const { timeAgo } = await import("../AdminNotificationBell");
    const dict: Record<string, string> = aiPipelineVi;
    const t = (key: string) => dict[key] ?? key;
    const now = Date.parse("2026-10-19T10:00:00Z");
    expect(timeAgo("2026-10-19T09:59:40Z", now, t)).toBe("vừa xong");
    expect(timeAgo("2026-10-19T09:55:00Z", now, t)).toBe("5 phút trước");
    expect(timeAgo("2026-10-19T07:00:00Z", now, t)).toBe("3 giờ trước");
  });
});
