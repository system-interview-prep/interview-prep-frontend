import React from "react";

export interface QuestionTimerBadgeProps {
  /**
   * Số giây còn lại của câu hỏi.
   */
  timeLeft: number;
  /**
   * Chuỗi thời gian đã được định dạng mm:ss (ví dụ: "00:45", "00:08").
   */
  formattedTime: string;
  /**
   * Cờ đánh dấu sắp hết giờ (< 10s).
   */
  isWarning: boolean;
  /**
   * Cờ đánh dấu đã hết giờ và đang trong hiệu ứng chuyển câu (800ms).
   */
  isTimingOut?: boolean;
  /**
   * Tỷ lệ thời gian đã trôi qua (0 -> 100%).
   */
  progressPct?: number;
  /**
   * ClassName tùy chỉnh bổ sung nếu cần.
   */
  className?: string;
}

/**
 * QuestionTimerBadge - Huy hiệu đếm ngược theo phong cách Clean Chunky / Neo-brutalism.
 * Tích hợp trạng thái cảnh báo chuyển sang tông đỏ (#D32F2F) kèm hiệu ứng animate-pulse nhẹ.
 */
export const QuestionTimerBadge: React.FC<QuestionTimerBadgeProps> = ({
  timeLeft,
  formattedTime,
  isWarning,
  isTimingOut = false,
  progressPct,
  className = "",
}) => {
  const isAlert = isWarning || isTimingOut;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Thời gian làm câu hiện tại: ${timeLeft} giây`}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 px-3 py-1.5 select-none transition-all duration-200 ${
        isAlert
          ? "border-[#D32F2F] bg-red-50 text-[#D32F2F] shadow-[2px_2px_0_#D32F2F] animate-pulse"
          : "border-[#234196] bg-white text-[#234196] shadow-[2px_2px_0_#234196] hover:bg-[#FEF9EE]"
      } ${className}`}
    >
      {/* Mini Progress Bar viền đáy thể hiện thời gian còn lại */}
      {typeof progressPct === "number" && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5"
        >
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              isAlert ? "bg-[#D32F2F]" : "bg-[#FCB625]"
            }`}
            style={{ width: `${Math.max(0, 100 - progressPct)}%` }}
          />
        </div>
      )}

      {/* Icon đồng hồ */}
      <span
        className={`material-symbols-outlined text-[18px] leading-none transition-transform ${
          isAlert ? "scale-110 text-[#D32F2F]" : "text-[#234196]"
        }`}
        style={{ fontVariationSettings: isAlert ? "'FILL' 1" : "'FILL' 0" }}
        aria-hidden="true"
      >
        {isTimingOut ? "hourglass_bottom" : "schedule"}
      </span>

      {/* Thời gian hiển thị dạng monospace */}
      <span className="font-mono text-xs sm:text-sm font-black tracking-wider">
        {formattedTime}
      </span>

      {/* Tag thông báo khi khẩn cấp (< 10s) hoặc đang chuyển câu */}
      {isTimingOut ? (
        <span className="rounded bg-[#D32F2F] px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          Chuyển câu...
        </span>
      ) : isWarning ? (
        <span className="rounded bg-[#D32F2F] px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          Sắp hết giờ
        </span>
      ) : null}
    </div>
  );
};

export default QuestionTimerBadge;
