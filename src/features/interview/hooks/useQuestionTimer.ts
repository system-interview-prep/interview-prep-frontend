import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseQuestionTimerOptions {
  /**
   * Số thứ tự câu hỏi hiện tại. Mỗi khi step thay đổi, timer sẽ tự động reset.
   */
  step: number;
  /**
   * Thời gian quy định cho mỗi câu hỏi tính theo giây (mặc định 45s).
   */
  duration?: number;
  /**
   * Cờ tạm dừng bộ đếm (khi bài làm đã kết thúc, đang mở modal hoặc chuyển tab).
   */
  isPaused?: boolean;
  /**
   * Callback kích hoạt khi hết thời gian.
   */
  onTimeout?: () => void;
}

export interface UseQuestionTimerReturn {
  /**
   * Số giây còn lại cho câu hỏi hiện tại.
   */
  timeLeft: number;
  /**
   * Chuỗi định dạng thời gian mm:ss (ví dụ: "00:45", "00:08").
   */
  formattedTime: string;
  /**
   * Phần trăm thời gian đã trôi qua (0 -> 100%).
   */
  progressPct: number;
  /**
   * Đánh dấu trạng thái khẩn cấp khi thời gian còn dưới 10 giây.
   */
  isWarning: boolean;
  /**
   * Hàm reset thủ công bộ đếm về thời gian duration ban đầu.
   */
  reset: () => void;
}

/**
 * Custom Hook quản lý bộ đếm ngược theo từng câu hỏi (Per-question Timer).
 * Đảm bảo:
 * - Tự động reset mỗi khi câu hỏi (step) thay đổi.
 * - Dùng ref cho onTimeout để tránh re-trigger interval do thay đổi reference callback.
 * - Dọn dẹp interval sạch sẽ khi unmount / đổi câu hỏi để tránh memory leak.
 */
export function useQuestionTimer({
  step,
  duration = 45,
  isPaused = false,
  onTimeout,
}: UseQuestionTimerOptions): UseQuestionTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number>(duration);

  // Lưu onTimeout vào ref để callback luôn mới nhất mà không gây re-subscribe interval
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset thủ công
  const reset = useCallback(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Tự động reset thời gian khi step hoặc duration thay đổi
  useEffect(() => {
    setTimeLeft(duration);
  }, [step, duration]);

  // Quản lý interval đếm ngược từng giây
  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Chỉ trigger timeout 1 lần khi chuyển từ 1 về 0
          if (prev === 1) {
            window.setTimeout(() => {
              onTimeoutRef.current?.();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [step, isPaused]);

  // Định dạng chuỗi mm:ss
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeft]);

  // Tính phần trăm thời gian đã trôi qua
  const progressPct = useMemo(() => {
    if (duration <= 0) return 100;
    const elapsed = duration - timeLeft;
    return Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
  }, [duration, timeLeft]);

  // Cảnh báo khi thời gian <= 10 giây (và > 0)
  const isWarning = timeLeft <= 10 && timeLeft > 0;

  return {
    timeLeft,
    formattedTime,
    progressPct,
    isWarning,
    reset,
  };
}
