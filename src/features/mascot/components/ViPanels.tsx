"use client";

import Link from "next/link";
import { CheckCircle2, FileText, MessagesSquare, UserRound, X } from "lucide-react";
import FoxAvatar, { type FoxAvatarPose } from "./FoxAvatar";
import { fillLine as fill, type ViEvent, type ViEventKind, type ViJourney } from "../utils/viJourney";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";

type Translate = (key: string) => string;

function eventVars(event: ViEvent, t: Translate): Record<string, string | number> {
  return {
    subject: event.subject || t("guide.subject.fallback"),
    step: event.step ?? 1,
    mode: event.mode ? t(`guide.mode.${event.mode}`) : "",
  };
}

const EVENT_POSE: Record<ViEventKind, FoxAvatarPose> = {
  cvFailed: "dizzy",
  openSession: "surprised",
  reportReady: "delighted",
  cvReady: "sparkle",
  cvProcessing: "think",
};

/** Journey steps, the current one opened with what to do, then what just happened. */
export function ViJourneyPanel({ journey, onNavigate }: { journey: ViJourney; onNavigate: () => void }) {
  const { t } = useLanguage();
  const doneCount = journey.steps.filter((step) => step.state === "done").length;
  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
      <div className="space-y-2">
        <div className="flex justify-between text-[12px] font-semibold text-[#4A5878]">
          <span>{t("guide.journey")}</span>
          <span>{fill(t("guide.journeyProgress"), { done: doneCount })}</span>
        </div>
        <div className="grid grid-cols-4 gap-1" aria-hidden="true">
          {journey.steps.map((step) => (
            <span
              key={step.key}
              className={cn(
                "h-1.5 rounded-full",
                step.state === "done" ? "bg-[#287A4B]" : step.state === "current" ? "bg-[#204195]" : "bg-[#DCE4F3]",
              )}
            />
          ))}
        </div>
      </div>

      <ol className="space-y-1.5">
        {journey.steps.map((step, index) =>
          step.state === "current" ? (
            <li key={step.key} className="space-y-2.5 rounded-2xl bg-[#EEF2FD] p-3 ring-1 ring-[#C9D6F5]" aria-current="step">
              <div className="flex items-center gap-2.5">
                <span className="grid size-[22px] place-items-center rounded-full bg-[#204195] text-[12px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-[#14244B]">{t(`guide.step.${step.key}`)}</span>
              </div>
              <p className="ml-8 text-[13px] leading-5 text-[#33415F]">{t(`guide.step.${step.key}.hint`)}</p>
              <Link
                href={step.href}
                onClick={onNavigate}
                className="ml-8 inline-flex h-10 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t(`guide.step.${step.key}.action`)}
              </Link>
            </li>
          ) : (
            <li key={step.key} className="flex items-center gap-2.5 px-2.5 py-1.5">
              {step.state === "done" ? (
                <CheckCircle2 className="size-[22px] shrink-0 text-[#287A4B]" aria-hidden="true" />
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#C9D4EA] text-[11px] font-bold text-[#607096]">
                  {index + 1}
                </span>
              )}
              <span className={cn("text-[13px] text-[#4A5878]", step.state === "done" && "line-through")}>
                {t(`guide.step.${step.key}`)}
              </span>
            </li>
          ),
        )}
      </ol>

      {!journey.current ? (
        <div className="space-y-2.5 rounded-2xl bg-[#F8FAFC] p-3 ring-1 ring-[#EAEFF8]">
          <p className="text-[13px] leading-5 text-[#33415F]">{t("guide.allDone")}</p>
          <Link
            href="/interview/select"
            onClick={onNavigate}
            className="inline-flex h-10 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white hover:bg-[#183275]"
          >
            {t("guide.allDoneAction")}
          </Link>
        </div>
      ) : null}

      {journey.events.length ? (
        <div className="space-y-2 border-t border-[#EAEFF8] pt-3">
          <p className="text-[12px] font-semibold text-[#607096]">{t("guide.recent")}</p>
          <ul className="space-y-1.5">
            {journey.events.map((event) => (
              <li key={event.id}>
                <Link
                  href={event.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] text-[#14244B] ring-1 transition-colors",
                    event.kind === "cvFailed"
                      ? "bg-[#FFF5F5] ring-[#F3C9C9] hover:bg-[#FDEBEB]"
                      : event.kind === "openSession"
                        ? "bg-[#FFF6EE] ring-[#F1C9A5] hover:bg-[#FDEEDF]"
                        : "bg-[#F8FAFC] ring-[#EAEFF8] hover:bg-[#F0F4FC]",
                  )}
                >
                  {event.kind === "openSession" || event.kind === "reportReady" ? (
                    <MessagesSquare className="size-[18px] shrink-0 text-[#204195]" aria-hidden="true" />
                  ) : (
                    <FileText className="size-[18px] shrink-0 text-[#204195]" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{fill(t(`guide.event.${event.kind}`), eventVars(event, t))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Signed-out visitors and marketing pages: the page tips, as before. */
export function ViTipsPanel({
  pageLine,
  tips,
  onNavigate,
}: {
  pageLine: string | null;
  tips: string[];
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6 text-[#14244B]">
      {pageLine ? <p>{pageLine}</p> : null}
      {tips.length ? (
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li
              key={tip}
              className="anim-rise rounded-2xl bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#14244B] ring-1 ring-[#EAEFF8]"
              style={{ ["--i" as string]: index + 1 }}
            >
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        href="/interview/select"
        onClick={onNavigate}
        className="inline-flex h-10 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white hover:bg-[#183275]"
      >
        {t("guide.step.interview.action")}
      </Link>
    </div>
  );
}

function BubbleShell({
  pose,
  tone = "default",
  onClose,
  children,
}: {
  pose: FoxAvatarPose;
  tone?: "default" | "error" | "warn";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "anim-pop relative flex w-[min(350px,calc(100vw-2rem))] origin-bottom-right gap-3 rounded-[22px] bg-white p-4 pr-10 shadow-[0_18px_44px_-18px_rgba(20,36,75,0.45)] ring-1",
        tone === "error" ? "ring-[#F3C9C9]" : tone === "warn" ? "ring-[#F1C9A5]" : "ring-[#DCE4F3]",
      )}
    >
      <FoxAvatar size={52} pose={pose} />
      <div className="min-w-0 flex-1 space-y-1.5">{children}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("guide.dismiss")}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** One piece of news: what happened and the one thing to do about it. */
export function ViEventBubble({ event, onClose }: { event: ViEvent; onClose: () => void }) {
  const { t } = useLanguage();
  const vars = eventVars(event, t);
  const hasAction = event.kind !== "cvProcessing";
  return (
    <BubbleShell
      pose={EVENT_POSE[event.kind]}
      tone={event.kind === "cvFailed" ? "error" : event.kind === "openSession" ? "warn" : "default"}
      onClose={onClose}
    >
      <p className="text-sm font-bold text-[#14244B]">{fill(t(`guide.event.${event.kind}.title`), vars)}</p>
      <p className="text-[13px] leading-5 text-[#33415F]">{fill(t(`guide.event.${event.kind}.body`), vars)}</p>
      {event.kind === "cvProcessing" ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#DCE4F3]" aria-hidden="true">
          <div className="h-1.5 rounded-full bg-[#204195]" style={{ width: `${Math.round(((event.step ?? 1) / 3) * 100)}%` }} />
        </div>
      ) : null}
      {hasAction ? (
        <div className="flex flex-wrap gap-2 pt-1.5">
          <Link
            href={event.href}
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white hover:bg-[#183275]"
          >
            {t(`guide.event.${event.kind}.action`)}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full px-3 text-[13px] font-semibold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
          >
            {t("guide.later")}
          </button>
        </div>
      ) : null}
    </BubbleShell>
  );
}

/** On the mode picker: Vi steps back and introduces the AI interviewer. */
export function ViHandoffBubble({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <BubbleShell pose="heart" onClose={onClose}>
      <p className="text-sm font-bold text-[#14244B]">{t("guide.handoff.title")}</p>
      <p className="text-[13px] leading-5 text-[#33415F]">{t("guide.handoff.body")}</p>
      <div className="grid gap-1.5 pt-1.5">
        <div className="flex items-center gap-2 rounded-2xl bg-[#FFF6EE] p-2">
          <FoxAvatar size={30} pose="front" />
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className="text-[12px] font-bold text-[#14244B]">{t("guide.name")}</span>
            <span className="text-[12px] text-[#4A5878]">{t("guide.handoff.vi")}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#EEF2FD] p-2">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#204195] text-white">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className="text-[12px] font-bold text-[#14244B]">{t("guide.handoff.interviewer")}</span>
            <span className="text-[12px] text-[#4A5878]">{t("guide.handoff.interviewerRole")}</span>
          </span>
        </div>
      </div>
    </BubbleShell>
  );
}
