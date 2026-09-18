"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { MascotMood } from "../types";

const STAR_TIPS = [
  "Mẹo STAR: Mô tả Tình huống (Situation) ngắn gọn, tập trung vào Hành động (Action) của bạn!",
  "Mẹo STAR: Nhấn mạnh Kết quả (Result) bằng con số hoặc tỷ lệ phần trăm cụ thể!",
  "Cáo INTERVIA chúc bạn tự tin trả lời phỏng vấn đạt điểm cao nhất!",
  "Hãy bình tĩnh lắng nghe câu hỏi từ AI và ngắt lời bằng nút Interrupt khi cần!",
];

export function useMascotMood(initialMood: MascotMood = "idle") {
  const [mood, setMood] = useState<MascotMood>(initialMood);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    if (pathname.includes("/interview/room") || pathname.includes("/practice")) {
      setMood("coaching");
      setSpeechText(STAR_TIPS[Math.floor(Math.random() * STAR_TIPS.length)]);
    } else if (pathname.includes("/interview/results")) {
      setMood("happy");
      setSpeechText("Chúc mừng bạn đã hoàn thành bài phỏng vấn xuất sắc!");
    } else if (pathname.includes("/dashboard/cvs")) {
      setMood("thinking");
      setSpeechText("Hãy tối ưu từ khóa kỹ thuật để nâng điểm ATS trên 85% nhé!");
    } else {
      setMood("idle");
      setSpeechText(null);
    }
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

  return { mood, setMood, speechText, setSpeechText, triggerMood };
}

export default useMascotMood;
