"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthProfile } from "../../auth/useAuthProfile";
import { useQuestionTimer } from "../../hooks/useQuestionTimer";
import { QuestionTimerBadge } from "../../components/practice/QuestionTimerBadge";

const QUESTION_IDS = ["q1", "q2", "q3"] as const;
type QuestionId = (typeof QUESTION_IDS)[number];

const CORRECT: Record<QuestionId, number> = {
  q1: 1,
  q2: 1,
  q3: 1,
};

const LETTERS = ["A", "B", "C"] as const;

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PracticePage() {
  const { t } = useLanguage();
  const { profile, displayName } = useAuthProfile();
  const fieldsetId = useId();

  const [step, setStep] = useState(0);
  const [avatarError, setAvatarError] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    QUESTION_IDS.map(() => null),
  );
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // Trạng thái hết giờ và đang trong hiệu ứng chuyển câu (800ms)
  const [isTimingOut, setIsTimingOut] = useState(false);
  const timeoutTransitionRef = useRef<number | null>(null);

  // Dọn dẹp timer chuyển câu khi unmount
  useEffect(() => {
    return () => {
      if (timeoutTransitionRef.current) {
        window.clearTimeout(timeoutTransitionRef.current);
      }
    };
  }, []);

  const qid = QUESTION_IDS[step];
  const options = useMemo(
    () => [t(`practice.${qid}.a`), t(`practice.${qid}.b`), t(`practice.${qid}.c`)] as string[],
    [t, qid],
  );

  // Tính running accuracy và số câu đã trả lời
  const { runningPct, answeredCount } = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (let i = 0; i < QUESTION_IDS.length; i++) {
      const id = QUESTION_IDS[i];
      const a = i < step ? answers[i] : i === step ? picked : answers[i];
      if (a === null || a === undefined) continue;
      answered += 1;
      if (a === CORRECT[id]) correct += 1;
    }
    return {
      runningPct: answered ? Math.round((correct / answered) * 100) : 0,
      answeredCount: answered,
    };
  }, [answers, step, picked]);

  const progressPct = useMemo(() => {
    const completedCount = answers.filter((a) => a !== null).length;
    return Math.min(100, Math.round((completedCount / QUESTION_IDS.length) * 100));
  }, [answers]);

  const roleLabel = t("userDash.roleFallback");

  // Xử lý chọn câu trả lời (bị khóa nếu đang trong hiệu ứng chuyển câu)
  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (isTimingOut) return;
      setPicked(optionIndex);
      const nextAnswers = [...answers];
      nextAnswers[step] = optionIndex;
      setAnswers(nextAnswers);
    },
    [answers, isTimingOut, step],
  );

  // Xử lý chuyển tiếp câu hỏi thủ công / hoàn tất
  const handleNext = useCallback(() => {
    if (isTimingOut) return;
    if (timeoutTransitionRef.current) {
      window.clearTimeout(timeoutTransitionRef.current);
      timeoutTransitionRef.current = null;
    }

    const currentAns = picked !== null ? picked : answers[step];
    if (currentAns === null) return;

    const nextAnswers = [...answers];
    nextAnswers[step] = currentAns;
    setAnswers(nextAnswers);

    if (step >= QUESTION_IDS.length - 1) {
      const finalScore = nextAnswers.reduce<number>((acc, ans, i) => {
        if (ans === null) return acc;
        return acc + (ans === CORRECT[QUESTION_IDS[i]] ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setDone(true);
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    setPicked(nextAnswers[nextStep] ?? null);
  }, [isTimingOut, picked, answers, step]);

  // Xử lý lùi câu hỏi
  const handlePrev = useCallback(() => {
    if (isTimingOut || step === 0) return;
    const prevStep = step - 1;
    setStep(prevStep);
    setPicked(answers[prevStep] ?? null);
  }, [isTimingOut, step, answers]);

  // Quick jump trực tiếp tới câu bất kỳ
  const handleJump = useCallback(
    (targetIndex: number) => {
      if (isTimingOut || targetIndex === step) return;
      // Lưu lại đáp án của câu hiện tại nếu có chọn
      if (picked !== null && answers[step] !== picked) {
        const nextAnswers = [...answers];
        nextAnswers[step] = picked;
        setAnswers(nextAnswers);
      }
      setStep(targetIndex);
      setPicked(answers[targetIndex] ?? null);
    },
    [isTimingOut, step, picked, answers],
  );

  // Xử lý khi hết giờ mỗi câu (Per-question timeout với Auto-advance 800ms phản hồi thị giác)
  const handleTimeout = useCallback(() => {
    // 1. Kích hoạt phản hồi thị giác và disable tương tác ngay lập tức
    setIsTimingOut(true);

    // 2. Ghi nhận đáp án: Nếu đã chọn trước đó thì giữ nguyên, nếu chưa thì bỏ trống (null)
    const currentAns = picked !== null ? picked : answers[step];
    const nextAnswers = [...answers];
    nextAnswers[step] = currentAns;
    setAnswers(nextAnswers);

    // 3. Sau đúng 800ms hiển thị phản hồi, tự động chuyển câu hoặc nộp bài
    if (timeoutTransitionRef.current) {
      window.clearTimeout(timeoutTransitionRef.current);
    }

    timeoutTransitionRef.current = window.setTimeout(() => {
      setIsTimingOut(false);

      if (step >= QUESTION_IDS.length - 1) {
        const finalScore = nextAnswers.reduce<number>((acc, ans, i) => {
          if (ans === null) return acc;
          return acc + (ans === CORRECT[QUESTION_IDS[i]] ? 1 : 0);
        }, 0);
        setScore(finalScore);
        setDone(true);
        return;
      }

      const nextStep = step + 1;
      setStep(nextStep);
      setPicked(nextAnswers[nextStep] ?? null);
    }, 800);
  }, [picked, answers, step]);

  // Khởi tạo Custom Hook đếm ngược theo từng câu hỏi (45s mỗi câu)
  const timer = useQuestionTimer({
    step,
    duration: 45,
    isPaused: done || isTimingOut,
    onTimeout: handleTimeout,
  });

  // Khởi động lại
  function restart() {
    if (timeoutTransitionRef.current) {
      window.clearTimeout(timeoutTransitionRef.current);
      timeoutTransitionRef.current = null;
    }
    setIsTimingOut(false);
    setStep(0);
    setPicked(null);
    setAnswers(QUESTION_IDS.map(() => null));
    setScore(0);
    setDone(false);
    timer.reset();
  }

  // Keyboard navigation
  useEffect(() => {
    if (done || isTimingOut) return;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key;
      if (key === "1" || key.toLowerCase() === "a") {
        e.preventDefault();
        handleSelect(0);
      } else if (key === "2" || key.toLowerCase() === "b") {
        e.preventDefault();
        handleSelect(1);
      } else if (key === "3" || key.toLowerCase() === "c") {
        e.preventDefault();
        handleSelect(2);
      } else if (key === "Enter") {
        e.preventDefault();
        if (picked !== null || answers[step] !== null) {
          handleNext();
        }
      } else if (key === "Backspace" || key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (key === "ArrowRight") {
        if (picked !== null || answers[step] !== null) {
          e.preventDefault();
          handleNext();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done, isTimingOut, handleSelect, handleNext, handlePrev, picked, answers, step]);

  // Badge đánh giá năng lực dựa trên điểm số
  const assessmentBadge = useMemo(() => {
    const finalPct = Math.round((score / QUESTION_IDS.length) * 100);
    if (finalPct === 100) {
      return {
        label: "Xuất sắc · Sẵn sàng phỏng vấn",
        sub: "Bạn nắm rất vững các quy chuẩn phỏng vấn và phương pháp trả lời có cấu trúc.",
        bg: "bg-[#FCB625] text-[#234196] border-[#234196]",
      };
    }
    if (finalPct >= 60) {
      return {
        label: "Đạt chuẩn · Qualified",
        sub: "Kiến thức nền tảng tốt, chỉ cần tinh chỉnh thêm kỹ năng cấu trúc câu trả lời.",
        bg: "bg-emerald-100 text-emerald-900 border-emerald-700",
      };
    }
    return {
      label: "Cần cải thiện · Needs Practice",
      sub: "Hãy xem lại chi tiết nhận xét từ Coach bên dưới để củng cố các phương pháp cốt lõi.",
      bg: "bg-amber-100 text-amber-900 border-amber-700",
    };
  }, [score]);

  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-28 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-8 grid gap-6 border-b-2 border-[#234196] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl">
              <span className="sticker -rotate-1 bg-[#FCB625] text-[10px] text-[#234196]">
                {t("practice.eyebrow")}
              </span>
              <h1 className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-[#234196] sm:text-4xl md:text-5xl">
                {t("practice.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#5A6B8F] sm:text-base">
                {t("practice.subtitle")}
              </p>
            </div>

            {/* Profile badge & Language switcher */}
            <div className="flex min-w-0 items-center rounded-2xl border-2 border-[#234196] bg-white p-2 shadow-[3px_3px_0_#234196] lg:max-w-sm">
              <Link
                href="/dashboard"
                className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                {profile?.picture && !avatarError ? (
                  <img
                    alt={displayName || ""}
                    className="h-11 w-11 rounded-xl border-2 border-[#234196] object-cover"
                    src={profile.picture}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] font-headline text-sm font-extrabold text-[#234196]">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1 px-3">
                <p className="truncate text-sm font-bold text-[#234196]">
                  {displayName || t("userDash.profile.guest")}
                </p>
                <p className="mt-0.5 font-metadata text-[9px] font-bold text-[#5A6B8F] uppercase tracking-wider">
                  {roleLabel}
                </p>
              </div>
              <div className="h-8 w-px shrink-0 bg-[#B7C6E6]" aria-hidden="true" />
              <LanguageToggleButton className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#234196] transition-colors hover:bg-[#F0F4FC]" />
            </div>
          </header>

          {!done ? (
            /* Layout 2 cột: Cột chính 8 cols, Cột phụ tinh gọn 4 cols */
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
              {/* ================= CỘT CHÍNH (8 COLS) ================= */}
              <div className="lg:col-span-8 space-y-6">
                <div
                  className={`overflow-hidden rounded-2xl border-2 bg-white transition-colors duration-200 ${
                    isTimingOut
                      ? "border-[#D32F2F] shadow-[4px_4px_0_#D32F2F]"
                      : "border-[#234196] shadow-[4px_4px_0_#234196]"
                  }`}
                >
                  {/* Thanh tiến trình trên cùng */}
                  <div
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tiến độ làm bài: ${progressPct}%`}
                    className="h-2 w-full bg-[#E8EDF8]"
                  >
                    <div
                      className="h-full rounded-r-full bg-[#FCB625] transition-[width] duration-300 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* Interactive Question Matrix: Quick Jump Stepper & Countdown Timer */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#234196]/10 pb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#5A6B8F]">
                            Câu hỏi:
                          </span>
                          {/* Matrix Stepper Buttons */}
                          <div className="flex items-center gap-2" role="tablist" aria-label="Điều hướng nhanh câu hỏi">
                            {QUESTION_IDS.map((id, index) => {
                              const isCurrent = step === index;
                              const isAnswered = answers[index] !== null || (isCurrent && picked !== null);

                              let stepperClass =
                                "border-[#B7C6E6] bg-white text-[#5A6B8F] hover:border-[#234196] hover:bg-[#FEF9EE]";

                              if (isCurrent) {
                                stepperClass = isTimingOut
                                  ? "border-[#D32F2F] bg-red-50 text-[#D32F2F] font-extrabold shadow-[2px_2px_0_#D32F2F] ring-2 ring-[#D32F2F] ring-offset-1"
                                  : "border-[#234196] bg-[#FCB625] text-[#234196] font-extrabold shadow-[2px_2px_0_#234196] ring-2 ring-[#234196] ring-offset-1";
                              } else if (isAnswered) {
                                stepperClass =
                                  "border-[#234196] bg-[#234196] text-white font-bold shadow-[2px_2px_0_#234196]";
                              }

                              return (
                                <button
                                  key={id}
                                  type="button"
                                  disabled={isTimingOut}
                                  onClick={() => handleJump(index)}
                                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl border-2 px-2.5 text-xs transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:pointer-events-none disabled:opacity-60 ${stepperClass}`}
                                  aria-current={isCurrent ? "step" : undefined}
                                  aria-label={`Chuyển tới Câu ${index + 1} (${
                                    isCurrent ? "Đang làm" : isAnswered ? "Đã trả lời" : "Chưa trả lời"
                                  })`}
                                >
                                  <span>{index + 1}</span>
                                  {isAnswered && !isCurrent && (
                                    <span className="material-symbols-outlined ml-0.5 text-[14px]" aria-hidden="true">
                                      check
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Per-question countdown timer */}
                        <QuestionTimerBadge
                          timeLeft={timer.timeLeft}
                          formattedTime={timer.formattedTime}
                          isWarning={timer.isWarning}
                          isTimingOut={isTimingOut}
                          progressPct={timer.progressPct}
                        />
                      </div>

                      {/* Phím tắt gợi ý */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#5A6B8F]">
                        <span className="font-metadata text-[10px]">Phím tắt:</span>
                        <kbd className="rounded border border-[#234196] bg-[#FEF9EE] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#234196] shadow-[1px_1px_0_#234196]">
                          1-3
                        </kbd>
                        <span className="text-[#B7C6E6]">/</span>
                        <kbd className="rounded border border-[#234196] bg-[#FEF9EE] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#234196] shadow-[1px_1px_0_#234196]">
                          Enter ↵
                        </kbd>
                      </div>
                    </div>

                    {/* Phản hồi thị giác khi hết thời gian (Auto-advance 800ms) */}
                    {isTimingOut && (
                      <div
                        role="alert"
                        aria-live="assertive"
                        className="mb-5 flex items-center justify-between rounded-xl border-2 border-[#D32F2F] bg-red-50 p-3 text-xs sm:text-sm font-bold text-[#D32F2F] shadow-[2px_2px_0_#D32F2F] animate-in fade-in duration-150"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">
                            progress_activity
                          </span>
                          <span>
                            {step >= QUESTION_IDS.length - 1
                              ? "Hết thời gian! Đang hoàn tất bài luyện tập..."
                              : "Hết thời gian! Đang chuyển câu tiếp theo..."}
                          </span>
                        </div>
                        <span className="rounded bg-[#D32F2F] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                          {picked !== null || answers[step] !== null ? "Đã lưu đáp án" : "Bỏ trống"}
                        </span>
                      </div>
                    )}

                    {/* Tiêu đề câu hỏi */}
                    <h2
                      id={`question-label-${step}`}
                      className="mb-6 font-headline text-xl font-bold leading-snug text-[#17244A] sm:text-2xl"
                    >
                      {t(`practice.${qid}.question`)}
                    </h2>

                    {/* Danh sách options (No-Layout-Shift Card Design) */}
                    <fieldset
                      role="radiogroup"
                      aria-labelledby={`question-label-${step}`}
                      className="space-y-3"
                    >
                      <legend className="sr-only">{t(`practice.${qid}.question`)}</legend>

                      {options.map((label, i) => {
                        const isPicked = (picked !== null ? picked : answers[step]) === i;
                        const optionId = `${fieldsetId}-q${step}-opt${i}`;

                        return (
                          <label
                            key={i}
                            htmlFor={optionId}
                            onClick={() => !isTimingOut && handleSelect(i)}
                            className={`group flex min-h-[76px] w-full items-center rounded-2xl border-2 p-4 text-left transition-all duration-150 sm:p-5 ${
                              isTimingOut
                                ? "cursor-not-allowed opacity-65 pointer-events-none"
                                : "cursor-pointer hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            } ${
                              isPicked
                                ? isTimingOut
                                  ? "border-[#D32F2F] bg-red-50/50 shadow-[4px_4px_0_#D32F2F]"
                                  : "border-[#234196] bg-[#F0F4FC] shadow-[4px_4px_0_#234196]"
                                : "border-[#B7C6E6] bg-white hover:border-[#234196] hover:bg-[#FEF9EE] hover:shadow-[3px_3px_0_#234196]"
                            }`}
                          >
                            <input
                              type="radio"
                              id={optionId}
                              name={`question-${qid}`}
                              value={i}
                              checked={isPicked}
                              disabled={isTimingOut}
                              onChange={() => !isTimingOut && handleSelect(i)}
                              className="sr-only"
                              aria-label={`${LETTERS[i]}: ${label}`}
                            />

                            {/* Badge chữ cái A, B, C */}
                            <div
                              className={`mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-base font-headline font-bold transition-colors ${
                                isPicked
                                  ? isTimingOut
                                    ? "border-[#D32F2F] bg-[#D32F2F] text-white"
                                    : "border-[#234196] bg-[#FCB625] text-[#234196]"
                                  : "border-[#B7C6E6] bg-white text-[#5A6B8F] group-hover:border-[#234196] group-hover:text-[#234196]"
                              }`}
                            >
                              {LETTERS[i]}
                            </div>

                            {/* Nội dung câu trả lời */}
                            <span
                              className={`flex-1 text-sm sm:text-base leading-snug ${
                                isPicked ? "font-bold text-[#17244A]" : "font-medium text-[#344467]"
                              }`}
                            >
                              {label}
                            </span>

                            {/* Phím tắt gợi ý số */}
                            <span className="hidden sm:inline-block ml-3 shrink-0 rounded border border-transparent px-2 py-0.5 font-mono text-[11px] text-[#8DA3D2] group-hover:border-[#B7C6E6] group-hover:text-[#5A6B8F]">
                              [{i + 1}]
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>

                    {/* Vùng Coach Note: Thiết kế mượt mà tránh giật layout */}
                    <div className="mt-6">
                      {(picked !== null || answers[step] !== null) ? (
                        <div
                          className="rounded-xl border-2 border-[#234196] bg-[#FFF9E6] p-4 sm:p-5 shadow-[3px_3px_0_#234196] animate-in fade-in slide-in-from-top-2 duration-200"
                          role="region"
                          aria-live="polite"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="material-symbols-outlined mt-0.5 text-2xl text-[#FCB625]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              aria-hidden="true"
                            >
                              school
                            </span>
                            <div className="text-sm leading-relaxed text-[#344467]">
                              <p className="font-bold text-[#234196]">
                                {t("practice.coachNote")}
                              </p>
                              <p className="mt-1">{t(`practice.${qid}.feedback`)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[52px] items-center rounded-xl border border-dashed border-[#B7C6E6] px-4 py-3 text-xs text-[#5A6B8F]">
                          <span className="material-symbols-outlined mr-2 text-base text-[#8DA3D2]" aria-hidden="true">
                            info
                          </span>
                          <span>{t("practice.pickHint")}</span>
                        </div>
                      )}
                    </div>

                    {/* Thanh điều hướng Prev / Next */}
                    <div className="mt-8 flex flex-col-reverse gap-3 border-t-2 border-[#234196]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={step === 0 || isTimingOut}
                        className="chunky-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold disabled:pointer-events-none disabled:opacity-35 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        aria-label={t("practice.prev")}
                      >
                        <span className="material-symbols-outlined select-none text-lg leading-none" aria-hidden="true">
                          arrow_back
                        </span>
                        <span>{t("practice.prev")}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isTimingOut || (picked === null && answers[step] === null)}
                        onClick={handleNext}
                        className="chunky-primary inline-flex min-h-12 items-center justify-center gap-2 px-8 py-3 font-headline font-bold disabled:cursor-not-allowed disabled:opacity-45 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <span>
                          {isTimingOut
                            ? "Đang chuyển..."
                            : step >= QUESTION_IDS.length - 1
                            ? t("practice.finish")
                            : t("practice.next")}
                        </span>
                        <span className="material-symbols-outlined select-none text-lg leading-none" aria-hidden="true">
                          {isTimingOut ? "hourglass_empty" : "arrow_forward"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHỤ TINH GỌN (4 COLS) ================= */}
              {/* Không có quảng cáo rườm rà. Chỉ giữ lại 2 khối hữu ích: Mẹo AI & Tổng quan tiến độ */}
              <div className="flex flex-col gap-6 lg:col-span-4">
                {/* 1. Mẹo phỏng vấn từ AI (AI Tip Card màu xanh #234196) */}
                <section
                  className="rounded-2xl border-2 border-[#234196] bg-[#234196] p-6 text-white shadow-[4px_4px_0_#FCB625]"
                  aria-label="Mẹo phỏng vấn từ AI"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-[#FCB625] text-[#234196]">
                      <span
                        className="material-symbols-outlined text-xl leading-none"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden="true"
                      >
                        lightbulb
                      </span>
                    </div>
                    <h3 className="font-headline text-lg font-bold">
                      {t("practice.tip.title")}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-white/85">
                    {t("practice.tip.body")}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/15">
                    <Link
                      href="/resources"
                      className="inline-flex items-center text-xs font-bold text-[#FCB625] underline decoration-[#FCB625] decoration-2 underline-offset-4 transition-opacity hover:opacity-90"
                    >
                      <span>{t("practice.tip.link")}</span>
                      <span className="material-symbols-outlined ml-1 text-sm" aria-hidden="true">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </section>

                {/* 2. Tổng quan tiến độ làm bài (Progress & Stats Card) */}
                <section
                  className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196]"
                  aria-label="Tổng quan tiến độ làm bài"
                >
                  <div className="mb-5 flex items-center justify-between border-b-2 border-[#234196]/10 pb-3">
                    <h3 className="font-headline text-base font-bold text-[#234196]">
                      {t("practice.stats.title")}
                    </h3>
                    <span className="sticker bg-[#F0F4FC] text-[9px] text-[#234196]">
                      Đang thực hiện
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Số câu đã hoàn thành */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-bold">
                        <span className="text-[#5A6B8F]">Số câu hoàn thành</span>
                        <span className="text-[#234196]">
                          {answeredCount} / {QUESTION_IDS.length}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8EDF8]">
                        <div
                          className="h-full rounded-full bg-[#FCB625] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Độ chính xác hiện tại */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-bold">
                        <span className="text-[#5A6B8F]">{t("practice.stats.accuracy")}</span>
                        <span className="text-[#2E7D32]">
                          {answeredCount ? `${runningPct}%` : "—"}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8EDF8]">
                        <div
                          className="h-full rounded-full bg-[#2E7D32] transition-all duration-300"
                          style={{ width: `${answeredCount ? runningPct : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Thời gian câu hiện tại */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-bold">
                        <span className="text-[#5A6B8F]">Thời gian câu {step + 1}</span>
                        <span
                          className={`font-mono text-xs ${
                            timer.isWarning || isTimingOut ? "font-extrabold text-[#D32F2F] animate-pulse" : "text-[#234196]"
                          }`}
                        >
                          {isTimingOut ? "00:00 (Hết giờ)" : timer.formattedTime}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8EDF8]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            timer.isWarning || isTimingOut ? "bg-[#D32F2F]" : "bg-[#234196]"
                          }`}
                          style={{ width: `${Math.max(0, 100 - timer.progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Nhịp làm bài */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8EDF8] text-xs">
                      <span className="font-medium text-[#5A6B8F]">{t("practice.stats.pace")}</span>
                      <span className="font-bold text-[#234196]">
                        {t("practice.stats.paceValue")}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            /* ================= MÀN HÌNH TỔNG KẾT CHUYÊN NGHIỆP ================= */
            <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-300">
              {/* Thẻ điểm lớn trực quan */}
              <div className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white text-center shadow-[6px_6px_0_#234196]">
                <div className="border-b-2 border-[#234196] bg-[#234196] px-8 py-10 text-white">
                  <span className="sticker bg-[#FCB625] text-[10px] text-[#234196]">
                    {t("practice.finish")}
                  </span>

                  <p className="mt-3 font-headline text-6xl font-black tabular-nums tracking-tight">
                    {score}/{QUESTION_IDS.length}
                  </p>

                  <p className="mt-2 text-base font-medium text-white/90">
                    {t("practice.result")
                      .replace("{score}", String(score))
                      .replace("{total}", String(QUESTION_IDS.length))}
                  </p>

                  {/* Badge đánh giá năng lực */}
                  <div className="mt-4 flex flex-col items-center">
                    <span className={`sticker border-2 text-xs font-extrabold ${assessmentBadge.bg}`}>
                      {assessmentBadge.label}
                    </span>
                    <p className="mt-2 max-w-md text-xs text-white/80">
                      {assessmentBadge.sub}
                    </p>
                  </div>
                </div>

                {/* Thống kê tỷ lệ % */}
                <div className="grid grid-cols-2 divide-x-2 divide-[#234196]/15 border-b-2 border-[#234196]/15 bg-[#FEF9EE] p-4 text-center">
                  <div>
                    <p className="text-xs font-medium text-[#5A6B8F]">Tỷ lệ chính xác</p>
                    <p className="font-headline text-2xl font-black text-[#2E7D32]">
                      {Math.round((score / QUESTION_IDS.length) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#5A6B8F]">Số câu hoàn thành</p>
                    <p className="font-headline text-2xl font-black text-[#234196]">
                      {QUESTION_IDS.length}/{QUESTION_IDS.length}
                    </p>
                  </div>
                </div>

                {/* Cụm nút hành động */}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={restart}
                      className="chunky-primary min-h-12 px-7 py-3 font-bold"
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        restart_alt
                      </span>
                      <span>{t("practice.restart")}</span>
                    </button>

                    <Link
                      href="/dashboard"
                      className="chunky-secondary inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3 font-bold"
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        dashboard
                      </span>
                      <span>{t("practice.done.backDash")}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Danh sách tóm tắt từng câu hỏi (Review Breakdown) */}
              <div className="rounded-2xl border-2 border-[#234196] bg-white p-6 sm:p-8 shadow-[4px_4px_0_#234196]">
                <div className="mb-6 border-b-2 border-[#234196]/10 pb-4">
                  <h3 className="font-headline text-xl font-bold text-[#234196]">
                    Chi tiết từng câu hỏi & Lời khuyên
                  </h3>
                  <p className="mt-1 text-xs text-[#5A6B8F]">
                    Phân tích kết quả chi tiết kèm nhận xét chuyên sâu từ Coach cho từng câu.
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-[#E8EDF8]">
                  {QUESTION_IDS.map((id, index) => {
                    const userAns = answers[index];
                    const isCorrect = userAns === CORRECT[id];
                    const qOptions = [
                      t(`practice.${id}.a`),
                      t(`practice.${id}.b`),
                      t(`practice.${id}.c`),
                    ];

                    return (
                      <div key={id} className={index > 0 ? "pt-6" : ""}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="sticker bg-[#F0F4FC] text-[9px] text-[#234196]">
                            Câu {index + 1}
                          </span>
                          <span
                            className={`sticker text-[9px] font-bold ${
                              isCorrect
                                ? "bg-emerald-100 text-emerald-800 border-emerald-700"
                                : "bg-red-100 text-red-800 border-red-700"
                            }`}
                          >
                            {isCorrect ? "Đúng" : "Chưa chính xác"}
                          </span>
                        </div>

                        <p className="mt-3 font-headline text-base font-bold text-[#17244A]">
                          {t(`practice.${id}.question`)}
                        </p>

                        {/* Danh sách các options cùng đánh dấu đúng/sai */}
                        <div className="mt-3 space-y-2">
                          {qOptions.map((opt, optIndex) => {
                            const isUserPicked = userAns === optIndex;
                            const isAnsCorrect = optIndex === CORRECT[id];

                            let itemClass = "border-[#E8EDF8] bg-white text-[#5A6B8F]";
                            if (isAnsCorrect) {
                              itemClass =
                                "border-[#2E7D32] bg-emerald-50 text-[#1B5E20] font-semibold";
                            } else if (isUserPicked && !isAnsCorrect) {
                              itemClass =
                                "border-[#D32F2F] bg-red-50 text-[#8F1D1D] font-semibold";
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-xs sm:text-sm ${itemClass}`}
                              >
                                <span className="font-headline font-bold text-xs">
                                  {LETTERS[optIndex]}.
                                </span>
                                <span className="flex-1 leading-snug">{opt}</span>
                                {isAnsCorrect && (
                                  <span className="sticker border-0 bg-emerald-600 px-2 py-0.5 text-[8px] text-white">
                                    Đáp án đúng
                                  </span>
                                )}
                                {isUserPicked && !isAnsCorrect && (
                                  <span className="sticker border-0 bg-red-600 px-2 py-0.5 text-[8px] text-white">
                                    Bạn đã chọn
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Coach feedback */}
                        <div className="mt-3 rounded-xl border border-[#234196]/20 bg-[#FFF9E6] p-3.5 text-xs text-[#344467]">
                          <span className="font-bold text-[#234196]">
                            {t("practice.coachNote")}:
                          </span>{" "}
                          {t(`practice.${id}.feedback`)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </UserDashboardShell>
  );
}
