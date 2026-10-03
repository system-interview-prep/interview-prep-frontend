"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useQuestionTimer } from "@features/interview/hooks/useQuestionTimer";
import { QuestionTimerBadge } from "@features/interview/components/QuestionTimerBadge";
import { Check, Loader2, GraduationCap, Info, ArrowLeft, ArrowRight, Hourglass, Lightbulb, RotateCcw, LayoutDashboard, HelpCircle, FileText } from "lucide-react";
import { PracticeCvJdSection } from "@features/practice/components/PracticeCvJdSection";

const QUESTION_IDS = ["q1", "q2", "q3"] as const;
type QuestionId = (typeof QUESTION_IDS)[number];

const CORRECT: Record<QuestionId, number> = {
  q1: 1,
  q2: 1,
  q3: 1,
};

const LETTERS = ["A", "B", "C"] as const;

function PracticeContent() {
  const { t } = useLanguage();
  const fieldsetId = useId();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "cv-jd" ? "cv-jd" : "quiz";
  const [activeTab, setActiveTab] = useState<"quiz" | "cv-jd">(initialTab);

  const [step, setStep] = useState(0);
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
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-28 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-8 border-b border-[#EAEFF8] pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
                  {t("practice.eyebrow")}
                </span>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl">
                  {t("practice.title")}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#607096] sm:text-base">
                  {activeTab === "cv-jd"
                    ? "Luyện tập các câu hỏi tự luận bám sát hồ sơ CV và bản mô tả công việc (JD) đã chọn."
                    : t("practice.subtitle")}
                </p>
              </div>

              {/* Tab Selector */}
              <div className="inline-flex p-1.5 rounded-2xl border border-[#DCE4F3] bg-white shadow-2xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("quiz")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "quiz"
                      ? "bg-[#204195] text-white shadow-xs"
                      : "text-[#607096] hover:text-[#14244B] hover:bg-slate-50"
                  }`}
                >
                  <HelpCircle className="size-4" />
                  <span>Trắc nghiệm chuẩn hóa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cv-jd")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "cv-jd"
                      ? "bg-[#204195] text-white shadow-xs"
                      : "text-[#607096] hover:text-[#14244B] hover:bg-slate-50"
                  }`}
                >
                  <FileText className="size-4" />
                  <span>Theo CV–JD</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                      activeTab === "cv-jd"
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    Mới
                  </span>
                </button>
              </div>
            </div>
          </header>

          {activeTab === "cv-jd" ? (
            <PracticeCvJdSection />
          ) : !done ? (
            /* Layout 2 cột: Cột chính 8 cols, Cột phụ tinh gọn 4 cols */
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
              {/* ================= CỘT CHÍNH (8 COLS) ================= */}
              <div className="space-y-6 lg:col-span-8">
                <div
                  className={`overflow-hidden rounded-2xl border bg-white shadow-xs transition-colors duration-200 ${
                    isTimingOut
                      ? "border-red-300 ring-1 ring-red-400"
                      : "border-[#DCE4F3]"
                  }`}
                >
                  {/* Thanh tiến trình trên cùng */}
                  <div
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tiến độ làm bài: ${progressPct}%`}
                    className="h-1.5 w-full bg-[#EAEFF8]"
                  >
                    <div
                      className="h-full rounded-r-full bg-[#204195] transition-[width] duration-300 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* Interactive Question Matrix: Quick Jump Stepper & Countdown Timer */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEFF8] pb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#607096]">
                            Câu hỏi:
                          </span>
                          {/* Matrix Stepper Buttons */}
                          <div className="flex items-center gap-2" role="tablist" aria-label="Điều hướng nhanh câu hỏi">
                            {QUESTION_IDS.map((id, index) => {
                              const isCurrent = step === index;
                              const isAnswered = answers[index] !== null || (isCurrent && picked !== null);

                              let stepperClass =
                                "border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:bg-[#F8FAFC]";

                              if (isCurrent) {
                                stepperClass = "border-[#204195] bg-[#204195] text-white shadow-xs";
                              } else if (isAnswered) {
                                stepperClass = "border-[#C9D7F1] bg-[#F0F4FC] text-[#204195] font-semibold";
                              }

                              return (
                                <button
                                  key={id}
                                  type="button"
                                  role="tab"
                                  aria-selected={isCurrent}
                                  disabled={isTimingOut}
                                  onClick={() => handleJump(index)}
                                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold transition-all ${stepperClass}`}
                                >
                                  <span>{index + 1}</span>
                                  {isAnswered && !isCurrent && (
                                    <Check className="ml-0.5 size-3" aria-hidden="true" />
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
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#607096]">
                        <span>Phím tắt:</span>
                        <kbd className="rounded-md border border-[#DCE4F3] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#14244B]">
                          1-3
                        </kbd>
                        <span className="text-[#DCE4F3]">/</span>
                        <kbd className="rounded-md border border-[#DCE4F3] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#14244B]">
                          Enter ↵
                        </kbd>
                      </div>
                    </div>
                    {/* Phản hồi thị giác khi hết thời gian (Auto-advance 800ms) */}
                    {isTimingOut && (
                      <div
                        role="alert"
                        aria-live="assertive"
                        className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs sm:text-sm font-semibold text-red-600 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin size-4" aria-hidden="true" />
                          <span>
                            {step >= QUESTION_IDS.length - 1
                              ? "Hết thời gian! Đang hoàn tất bài luyện tập..."
                              : "Hết thời gian! Đang chuyển câu tiếp theo..."}
                          </span>
                        </div>
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          {picked !== null || answers[step] !== null ? "Đã lưu đáp án" : "Bỏ trống"}
                        </span>
                      </div>
                    )}

                    {/* Tiêu đề câu hỏi */}
                    <h2
                      id={`question-label-${step}`}
                      className="mb-6 text-xl font-bold leading-snug text-[#14244B] sm:text-2xl"
                    >
                      {t(`practice.${qid}.question`)}
                    </h2>

                    {/* Danh sách options */}
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
                            className={`group flex min-h-[68px] w-full items-center rounded-xl border p-4 text-left transition-all duration-150 sm:px-5 sm:py-4 ${
                              isTimingOut
                                ? "cursor-not-allowed opacity-65 pointer-events-none"
                                : "cursor-pointer"
                            } ${
                              isPicked
                                ? isTimingOut
                                  ? "border-red-300 bg-red-50/60 ring-1 ring-red-400"
                                  : "border-[#204195] bg-[#F0F4FC] ring-1 ring-[#204195]"
                                : "border-[#DCE4F3] bg-white hover:border-[#204195]/50 hover:bg-[#F8FAFC]"
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
                              className={`mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                                isPicked
                                  ? isTimingOut
                                    ? "border-red-500 bg-red-600 text-white"
                                    : "border-[#204195] bg-[#204195] text-white"
                                  : "border-[#DCE4F3] bg-[#F8FAFC] text-[#607096] group-hover:border-[#204195]/40 group-hover:text-[#204195]"
                              }`}
                            >
                              {LETTERS[i]}
                            </div>

                            {/* Nội dung câu trả lời */}
                            <span
                              className={`flex-1 text-sm sm:text-base leading-snug ${
                                isPicked ? "font-semibold text-[#14244B]" : "text-[#344467]"
                              }`}
                            >
                              {label}
                            </span>

                            {/* Phím tắt gợi ý số */}
                            <span className="hidden sm:inline-block ml-3 shrink-0 rounded border border-[#DCE4F3] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] text-[#607096]">
                              {i + 1}
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>

                    {/* Vùng Coach Note */}
                    <div className="mt-6">
                      {(picked !== null || answers[step] !== null) ? (
                        <div
                          className="rounded-xl border border-[#C9D7F1] bg-[#F0F4FC]/70 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200"
                          role="region"
                          aria-live="polite"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#204195]/10 text-[#204195]">
                              <GraduationCap className="size-4.5" aria-hidden="true" />
                            </div>
                            <div className="text-sm leading-relaxed text-[#344467]">
                              <p className="font-semibold text-[#204195]">
                                {t("practice.coachNote")}
                              </p>
                              <p className="mt-1">{t(`practice.${qid}.feedback`)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[48px] items-center rounded-xl border border-dashed border-[#DCE4F3] px-4 py-3 text-xs text-[#607096]">
                          <Info className="mr-2 size-4 text-[#607096] shrink-0" aria-hidden="true" />
                          <span>{t("practice.pickHint")}</span>
                        </div>
                      )}
                    </div>

                    {/* Thanh điều hướng Prev / Next */}
                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#EAEFF8] pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={step === 0 || isTimingOut}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-5 py-2.5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F8FAFC] disabled:pointer-events-none disabled:opacity-40"
                        aria-label={t("practice.prev")}
                      >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>{t("practice.prev")}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isTimingOut || (picked === null && answers[step] === null)}
                        onClick={handleNext}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#204195] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>
                          {isTimingOut
                            ? "Đang chuyển..."
                            : step >= QUESTION_IDS.length - 1
                            ? t("practice.finish")
                            : t("practice.next")}
                        </span>
                        {isTimingOut ? (
                          <Hourglass className="size-4" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHỤ TINH GỌN (4 COLS) ================= */}
              <div className="flex flex-col gap-6 lg:col-span-4">
                {/* 1. Mẹo phỏng vấn từ AI */}
                <section
                  className="rounded-2xl border border-[#204195]/20 bg-gradient-to-br from-[#14244B] via-[#204195] to-[#183275] p-6 text-white shadow-xs"
                  aria-label="Mẹo phỏng vấn từ AI"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#FCB625]">
                      <Lightbulb className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {t("practice.tip.title")}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-white/80">
                    {t("practice.tip.body")}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    <Link
                      href="/resources"
                      className="inline-flex items-center text-xs font-semibold text-[#FCB625] transition-opacity hover:opacity-90"
                    >
                      <span>{t("practice.tip.link")}</span>
                      <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </section>

                {/* 2. Tổng quan tiến độ làm bài */}
                <section
                  className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs"
                  aria-label="Tổng quan tiến độ làm bài"
                >
                  <div className="mb-5 flex items-center justify-between border-b border-[#EAEFF8] pb-3">
                    <h3 className="text-sm font-bold text-[#14244B]">
                      {t("practice.stats.title")}
                    </h3>
                    <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                      Đang thực hiện
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Số câu đã hoàn thành */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-medium">
                        <span className="text-[#607096]">Số câu hoàn thành</span>
                        <span className="font-semibold text-[#14244B]">
                          {answeredCount} / {QUESTION_IDS.length}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEFF8]">
                        <div
                          className="h-full rounded-full bg-[#204195] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Độ chính xác hiện tại */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-medium">
                        <span className="text-[#607096]">{t("practice.stats.accuracy")}</span>
                        <span className="font-semibold text-emerald-600">
                          {answeredCount ? `${runningPct}%` : "—"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEFF8]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${answeredCount ? runningPct : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Thời gian câu hiện tại */}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs font-medium">
                        <span className="text-[#607096]">Thời gian câu {step + 1}</span>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            timer.isWarning || isTimingOut ? "text-red-600 animate-pulse font-bold" : "text-[#14244B]"
                          }`}
                        >
                          {isTimingOut ? "00:00 (Hết giờ)" : timer.formattedTime}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEFF8]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            timer.isWarning || isTimingOut ? "bg-red-500" : "bg-[#204195]"
                          }`}
                          style={{ width: `${Math.max(0, 100 - timer.progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Nhịp làm bài */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EAEFF8] text-xs">
                      <span className="text-[#607096]">{t("practice.stats.pace")}</span>
                      <span className="font-semibold text-[#14244B]">
                        {t("practice.stats.paceValue")}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            /* ================= MÀN HÌNH TỔNG KẾT ================= */
            <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-300">
              {/* Thẻ điểm lớn trực quan */}
              <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white text-center shadow-xs">
                <div className="bg-gradient-to-br from-[#14244B] via-[#204195] to-[#183275] px-8 py-10 text-white">
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[#FCB625] backdrop-blur-xs">
                    {t("practice.finish")}
                  </span>

                  <p className="mt-3 text-6xl font-extrabold tabular-nums tracking-tight">
                    {score}/{QUESTION_IDS.length}
                  </p>

                  <p className="mt-2 text-base font-medium text-white/90">
                    {t("practice.result")
                      .replace("{score}", String(score))
                      .replace("{total}", String(QUESTION_IDS.length))}
                  </p>

                  {/* Badge đánh giá năng lực */}
                  <div className="mt-4 flex flex-col items-center">
                    <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
                      {assessmentBadge.label}
                    </span>
                    <p className="mt-2 max-w-md text-xs text-white/80">
                      {assessmentBadge.sub}
                    </p>
                  </div>
                </div>

                {/* Thống kê tỷ lệ % */}
                <div className="grid grid-cols-2 divide-x divide-[#DCE4F3] border-b border-[#DCE4F3] bg-[#F8FAFC] p-5 text-center">
                  <div>
                    <p className="text-xs font-medium text-[#607096]">Tỷ lệ chính xác</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                      {Math.round((score / QUESTION_IDS.length) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#607096]">Số câu hoàn thành</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#14244B]">
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
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#204195] px-7 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#183275]"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      <span>{t("practice.restart")}</span>
                    </button>

                    <Link
                      href="/dashboard"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-7 py-2.5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F8FAFC]"
                    >
                      <LayoutDashboard className="size-4" aria-hidden="true" />
                      <span>{t("practice.done.backDash")}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Danh sách tóm tắt từng câu hỏi (Review Breakdown) */}
              <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 sm:p-8 shadow-xs">
                <div className="mb-6 border-b border-[#EAEFF8] pb-4">
                  <h3 className="text-lg font-bold text-[#14244B]">
                    Chi tiết từng câu hỏi & Lời khuyên
                  </h3>
                  <p className="mt-1 text-xs text-[#607096]">
                    Phân tích kết quả chi tiết kèm nhận xét chuyên sâu từ Coach cho từng câu.
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-[#EAEFF8]">
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
                          <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                            Câu {index + 1}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {isCorrect ? "Đúng" : "Chưa chính xác"}
                          </span>
                        </div>

                        <p className="mt-3 text-base font-bold text-[#14244B]">
                          {t(`practice.${id}.question`)}
                        </p>

                        {/* Danh sách các options cùng đánh dấu đúng/sai */}
                        <div className="mt-3 space-y-2">
                          {qOptions.map((opt, optIndex) => {
                            const isUserPicked = userAns === optIndex;
                            const isAnsCorrect = optIndex === CORRECT[id];

                            let itemClass = "border-[#DCE4F3] bg-white text-[#607096]";
                            if (isAnsCorrect) {
                              itemClass =
                                "border-emerald-200 bg-emerald-50/70 text-emerald-800 font-medium";
                            } else if (isUserPicked && !isAnsCorrect) {
                              itemClass =
                                "border-red-200 bg-red-50/70 text-red-800 font-medium";
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${itemClass}`}
                              >
                                <span className="font-bold text-xs">
                                  {LETTERS[optIndex]}.
                                </span>
                                <span className="flex-1 leading-snug">{opt}</span>
                                {isAnsCorrect && (
                                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                    Đáp án đúng
                                  </span>
                                )}
                                {isUserPicked && !isAnsCorrect && (
                                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                    Bạn đã chọn
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Coach feedback */}
                        <div className="mt-3 rounded-xl border border-[#C9D7F1] bg-[#F0F4FC]/60 p-3.5 text-xs text-[#344467]">
                          <span className="font-semibold text-[#204195]">
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

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <UserDashboardShell>
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#204195]" />
          </div>
        </UserDashboardShell>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
