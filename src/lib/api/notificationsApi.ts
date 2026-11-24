import api from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = string;

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: Notification[];
};

export type ListNotificationsParams = {
  /** Chỉ lấy thông báo chưa đọc */
  unreadOnly?: boolean;
  /** Giới hạn số thông báo trả về (1–100, mặc định 50) */
  limit?: number;
};

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Notifications API – Khớp với BE module `notifications`
 *
 * Endpoints:
 *   GET    /notifications              → list()
 *   PATCH  /notifications/{id}/read   → markRead(id)
 *   DELETE /notifications/{id}        → remove(id)
 */
export const notificationsApi = {
  /**
   * Lấy danh sách thông báo của user hiện tại.
   * @param params Tuỳ chọn filter (unreadOnly, limit)
   */
  list: (params?: ListNotificationsParams) =>
    api.get<NotificationListResponse>('/notifications', { params }),

  /**
   * Đánh dấu thông báo là đã đọc (idempotent).
   * @param id ID của notification
   */
  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${encodeURIComponent(id)}/read`),

  /**
   * Xóa một thông báo.
   * @param id ID của notification
   */
  remove: (id: string) =>
    api.delete<void>(`/notifications/${encodeURIComponent(id)}`),

  /**
   * Tiện ích: Lấy số thông báo chưa đọc.
   * Gọi list({ unreadOnly: true, limit: 100 }) và đếm items.
   */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<NotificationListResponse>('/notifications', {
      params: { unreadOnly: true, limit: 100 },
    });
    return data.items?.length ?? 0;
  },
};
