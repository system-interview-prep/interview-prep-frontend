"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { MascotMood } from "../types";

const STAR_TIPS = [
  "Mẹo STAR: Mô tả Tình huống (Situation) ngắn gọn, tập trung vào Hành động (Action) của bạn!",
  "Mẹo STAR: Nhấn mạnh Kết quả (Result) bằng con số hoặc tỷ lệ phần trăm cụ thể!",
  "Cáo INTERVIA chúc bạn tự tin trả lời phỏng vấn đạt điểm cao nhất!",
  "Hãy bình tĩnh lắng nghe câu hỏi từ AI và ngắt lời bằng nút Interrupt khi cần!",
];

const SECTION_MASCOT_CONFIG: Record<
  string,
  { mood: MascotMood; text: string }
> = {
  hero: {
    mood: "happy",
    text: "Chào mừng bạn! INTERVIA giúp bạn vượt qua 99% thuật toán lọc CV ATS & tự tin diễn tập phỏng vấn!",
  },
  "social-proof": {
    mood: "encouraging",
    text: "Hơn 10,000+ ứng viên và đối tác công nghệ hàng đầu tin tưởng đồng hành cùng INTERVIA!",
  },
  "bento-features": {
    mood: "thinking",
    text: "Khám phá bộ 4 tính năng cốt lõi: Đối soát CV, Buồng thoại WebRTC, Biên bản STAR & Tuyển dụng văn minh!",
  },
  "demo-teaser": {
    mood: "coaching",
    text: "Cùng xem thử buồng thoại phỏng vấn AI với độ trễ phản hồi cực thấp dưới 500ms nhé!",
  },
  comparison: {
    mood: "surprised",
    text: "So sánh trực quan: Luyện phỏng vấn truyền thống mơ hồ vs Luyện cùng Cáo AI bám sát JD thực tế!",
  },
  pricing: {
    mood: "happy",
    text: "Bảng giá VietQR thanh toán 1 lần minh bạch, tuyệt đối không tự động gia hạn hay trừ tiền ẩn!",
  },
  faq: {
    mood: "thinking",
    text: "Giải đáp thắc mắc: AI nhận diện mượt mà thuật ngữ chuyên ngành Việt - Anh và không bịa đặt kinh nghiệm!",
  },
  "final-cta": {
    mood: "encouraging",
    text: "Bạn đã sẵn sàng nhận lời mời phỏng vấn tiếp theo? Nhấp nút bên dưới để bắt đầu ngay!",
  },
};

export function useMascotMood(initialMood: MascotMood = "idle") {
  const [mood, setMood] = useState<MascotMood>(initialMood);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [overrideState, setOverrideState] = useState<{
    mood: MascotMood;
    speechText: string | null;
  } | null>(null);
  const pathname = usePathname();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOverride = (e: Event) => {
      const customEv = e as CustomEvent<{ mood: MascotMood; speechText: string | null } | null>;
      if (customEv.detail) {
        setOverrideState({ mood: customEv.detail.mood, speechText: customEv.detail.speechText });
      } else {
        setOverrideState(null);
      }
    };

    window.addEventListener("mascot-override", handleOverride);
    return () => window.removeEventListener("mascot-override", handleOverride);
  }, []);

  useEffect(() => {
    if (!pathname) return;

    let timer: NodeJS.Timeout | null = null;

    if (pathname === "/") {
      setMood("happy");
      setSpeechText("Chào bạn! Tôi là Cáo INTERVIA, cuộn xuống để khám phá các tính năng luyện phỏng vấn nhé!");

      // IntersectionObserver with threshold 0.4 and scroll debouncing
      const sectionIds = Object.keys(SECTION_MASCOT_CONFIG);
      const observerCallback: IntersectionObserverCallback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const config = SECTION_MASCOT_CONFIG[entry.target.id];
            if (config) {
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => {
                setMood(config.mood);
                setSpeechText(config.text);
              }, 120);
            }
          }
        });
      };

      const observer = new IntersectionObserver(observerCallback, {
        threshold: 0.4,
        rootMargin: "-5% 0px -15% 0px",
      });

      // Small delay to allow DOM sections to render
      const setupTimeout = setTimeout(() => {
        sectionIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el) observer.observe(el);
        });
      }, 300);

      return () => {
        clearTimeout(setupTimeout);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        observer.disconnect();
      };
    } else if (pathname.includes("/pricing") || pathname.includes("/solutions")) {
      setMood("happy");
      setSpeechText("Chào bạn! Cần tôi tư vấn thêm về lộ trình luyện phỏng vấn không?");
    } else if (pathname.includes("/login") || pathname.includes("/signup")) {
      setMood("idle");
      setSpeechText(null);

      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.getAttribute("type") === "password" || target.dataset.mascot === "password")) {
          setMood("typing_password");
          setSpeechText("Đang bảo mật mật khẩu của bạn...");
        }
      };

      const handleFocusOut = (e: FocusEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.getAttribute("type") === "password" || target.dataset.mascot === "password")) {
          setMood("idle");
          setSpeechText(null);
        }
      };

      document.addEventListener("focusin", handleFocusIn);
      document.addEventListener("focusout", handleFocusOut);

      return () => {
        document.removeEventListener("focusin", handleFocusIn);
        document.removeEventListener("focusout", handleFocusOut);
        if (timer) clearTimeout(timer);
      };
    } else if (pathname.includes("/interview/room") || pathname.includes("/practice")) {
      setMood("coaching");
      setSpeechText(STAR_TIPS[Math.floor(Math.random() * STAR_TIPS.length)]);
    } else if (pathname.includes("/interview/results")) {
      setMood("happy");
      setSpeechText("Chúc mừng bạn đã hoàn thành bài phỏng vấn xuất sắc!");
    } else if (pathname.includes("/dashboard")) {
      setMood("thinking");
      setSpeechText("Tải CV lên để mình đối chiếu theo chuẩn STAR nhé!");
    } else {
      setMood("idle");
      setSpeechText(null);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  const triggerMood = useCallback(
    (newMood: MascotMood, durationMs?: number, customText?: string) => {
      setMood(newMood);
      if (customText !== undefined) setSpeechText(customText);
      if (durationMs) {
        setTimeout(() => {
          setMood("idle");
          setSpeechText(null);
        }, durationMs);
      }
    },
    []
  );

  const activeMood = overrideState ? overrideState.mood : mood;
  const activeSpeechText = overrideState ? overrideState.speechText : speechText;

  return { mood: activeMood, setMood, speechText: activeSpeechText, setSpeechText, triggerMood };
}

export default useMascotMood;
