"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import FoxAvatar, { type FoxAvatarPose } from "./FoxAvatar";
import { ViEventBubble, ViHandoffBubble, ViJourneyPanel, ViTipsPanel } from "./ViPanels";
import type { MascotMood } from "../types";
import type { MascotLine } from "../hooks/useMascotMood";
import { resolveRouteScene } from "../hooks/useMascotMood";
import { fillLine, type ViEvent, type ViJourney, type ViStatus } from "../utils/viJourney";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";

// A bubble fades after a while so it never sits on top of content.
const BUBBLE_LINGER_MS = 8000;
const EVENT_LINGER_MS = 12000;
const SEEN_KEY = "assistant.seen_routes";
const ANNOUNCED_KEY = "vi.announced";

const POSE_BY_MOOD: Partial<Record<MascotMood, FoxAvatarPose>> = {
  happy: "sparkle",
  celebrating: "delighted",
  encouraging: "heart",
  coaching: "wink",
};

const POSE_BY_STATUS: Record<ViStatus, FoxAvatarPose> = {
  error: "dizzy",
  open: "surprised",
  busy: "think",
  todo: "sparkle",
  done: "heart",
};

/** True the first time this key is seen in this browser session. */
function firstVisitThisSession(key: string): boolean {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]"));
    if (seen.has(key)) return false;
    seen.add(key);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    return true;
  } catch {
    return true;
  }
}

function parseIds(raw: string | null): Set<string> {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

type Bubble =
  | { kind: "line"; line: MascotLine }
  | { kind: "event"; event: ViEvent }
  | { kind: "handoff" };

/**
 * Vi, the fox in the corner: a guide, not a chatbot. The launcher says what
 * is going on (reading a CV, a session still open, what to do next); the
 * panel shows the candidate's journey and what the system just did. Vi speaks
 * up only for real events, once each, and can be muted. Signed-out visitors
 * and marketing pages get the page tips instead of the journey.
 */
export function MascotContainer({
  mood = "idle",
  line,
  journey = null,
  className,
}: {
  mood?: MascotMood;
  line: MascotLine | null;
  journey?: ViJourney | null;
  onPoke?: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const pathname = usePathname() || "";
  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mutedRaw, setMutedRaw] = useLocalStorageValue("assistant.muted");
  const muted = mutedRaw === "1";
  const [announcedRaw, setAnnouncedRaw] = useLocalStorageValue(ANNOUNCED_KEY);
  const announced = useMemo(() => parseIds(announcedRaw), [announcedRaw]);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  // A new event from the journey: announce it once, one bubble at a time.
  const nextEvent = journey?.events.find((event) => !announced.has(event.id)) ?? null;
  const showingEvent = bubble?.kind === "event";
  useEffect(() => {
    if (!nextEvent || muted || open || showingEvent) return;
    const event = nextEvent;
    setAnnouncedRaw(JSON.stringify([...announced, event.id].slice(-200)));
    queueMicrotask(() => setBubble({ kind: "event", event }));
    // Only a new event id (or the previous bubble closing) should start this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextEvent?.id, muted, open, showingEvent]);

  // Page lines: for visitors on every page once per session; for a signed-in
  // candidate only the overview greeting, the rest is news from the journey.
  // Choosing a mode: hand over to the AI interviewer, once per session.
  const hasJourney = journey !== null;
  const lastRouteLine = useRef<string | null>(null);
  useEffect(() => {
    if (muted || open) return;
    if (hasJourney && pathname.startsWith("/interview/select")) {
      if (!firstVisitThisSession(`handoff:${pathname}`)) return;
      queueMicrotask(() => setBubble((current) => (current?.kind === "event" ? current : { kind: "handoff" })));
      return;
    }
    if (!line) return;
    const isRouteLine = lastRouteLine.current !== pathname;
    lastRouteLine.current = pathname;
    if (isRouteLine && hasJourney && pathname !== "/dashboard") return;
    if (isRouteLine && !firstVisitThisSession(pathname)) return;
    queueMicrotask(() => setBubble((current) => (current?.kind === "event" ? current : { kind: "line", line })));
  }, [hasJourney, line, muted, open, pathname]);

  // Every bubble fades on its own.
  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(
      () => setBubble((current) => (current === bubble ? null : current)),
      bubble.kind === "line" ? BUBBLE_LINGER_MS : EVENT_LINGER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [bubble]);

  // Escape closes the panel and returns focus to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const scene = resolveRouteScene(pathname);
  const status: ViStatus | null = journey?.status ?? null;
  const busyEvent = journey?.events.find((event) => event.kind === "cvProcessing");
  const pose: FoxAvatarPose = status
    ? muted && (status === "done" || status === "todo")
      ? "sleepy"
      : status === "todo" && journey?.events[0]?.kind === "reportReady"
        ? "delighted"
        : POSE_BY_STATUS[status]
    : (POSE_BY_MOOD[mood] ?? "front");
  const statusText = status
    ? status === "busy"
      ? fillLine(t("guide.status.busy"), { step: busyEvent?.step ?? 1 })
      : t(`guide.status.${status}`)
    : t("guide.status.tips");
  const pending = journey?.pending ?? 0;
  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6", className)}>
      {open ? (
        <>
          <button
            type="button"
            aria-label={t("guide.close")}
            onClick={close}
            className="fixed inset-0 bg-[#14244B]/35 sm:hidden"
          />
          <section
            id={panelId}
            role="dialog"
            aria-label={t("guide.name")}
            className="anim-pop fixed inset-x-0 bottom-0 max-h-[85vh] origin-bottom overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_40px_-16px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] sm:static sm:w-[360px] sm:origin-bottom-right sm:rounded-3xl sm:shadow-[0_24px_60px_-24px_rgba(20,36,75,0.45)]"
          >
            <span aria-hidden="true" className="mx-auto mt-2.5 block h-1 w-10 rounded-full bg-[#C9D4EA] sm:hidden" />
            <header className="flex items-center gap-3 border-b border-[#EAEFF8] bg-[#F8FAFF] px-4 py-3">
              <FoxAvatar size={44} pose={pose} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#14244B]">{t("guide.name")}</p>
                <p className="text-[12px] text-[#4A5878]">{journey ? t("guide.subtitle") : t("guide.tipsSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t("guide.close")}
                className="grid h-10 w-10 place-items-center rounded-full text-[#607096] transition-colors hover:bg-white hover:text-[#14244B]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>
            {journey ? (
              <ViJourneyPanel journey={journey} onNavigate={() => setOpen(false)} />
            ) : (
              <ViTipsPanel
                pageLine={scene.speechKey ? t(scene.speechKey) : null}
                tips={(scene.tipKeys ?? []).map((key) => t(key))}
                onNavigate={() => setOpen(false)}
              />
            )}
            <footer className="flex flex-wrap items-center gap-2 border-t border-[#EAEFF8] px-4 py-2.5">
              <Link
                href="/dashboard/help"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center rounded-full px-2 text-[13px] font-semibold text-[#204195] hover:bg-[#F0F4FC]"
              >
                {t("guide.help")}
              </Link>
              <button
                type="button"
                onClick={() => setMutedRaw(muted ? "0" : "1")}
                aria-pressed={muted}
                className="ml-auto h-10 px-1 text-[12px] font-medium text-[#4A5878] underline underline-offset-4 hover:text-[#14244B]"
              >
                {muted ? t("guide.unmute") : t("guide.mute")}
              </button>
            </footer>
          </section>
        </>
      ) : bubble?.kind === "event" ? (
        <ViEventBubble event={bubble.event} onClose={() => setBubble(null)} />
      ) : bubble?.kind === "handoff" ? (
        <ViHandoffBubble onClose={() => setBubble(null)} />
      ) : bubble?.kind === "line" ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-pop relative hidden max-w-[300px] origin-bottom-right rounded-2xl bg-white px-4 py-3 pr-9 text-[13.5px] leading-relaxed text-[#14244B] shadow-[0_12px_32px_-12px_rgba(20,36,75,0.35)] ring-1 ring-[#DCE4F3] md:block"
        >
          {bubble.line.text}
          <button
            type="button"
            onClick={() => setBubble(null)}
            aria-label={t("guide.dismiss")}
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          setBubble(null);
          setOpen((value) => !value);
        }}
        aria-label={fillLine(t("guide.openWith"), { status: statusText })}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "group flex h-14 items-center gap-2.5 rounded-full bg-white pl-1 pr-4 shadow-[0_12px_30px_-14px_rgba(20,36,75,0.5)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none",
          status === "error"
            ? "bg-[#FFF5F5] ring-2 ring-[#C43B3B]"
            : status === "open"
              ? "ring-1 ring-[#F1C9A5]"
              : status === "busy"
                ? "ring-2 ring-[#204195]"
                : "ring-1 ring-[#C9D6F5]",
          open && "hidden sm:flex",
        )}
      >
        <FoxAvatar size={60} pose={pose} className="-mt-3.5" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[13px] font-bold text-[#14244B]">{t("guide.name")}</span>
          <span
            className={cn(
              "text-[12px]",
              status === "error"
                ? "font-semibold text-[#A12E2E]"
                : status === "open"
                  ? "font-semibold text-[#A14B0B]"
                  : "text-[#4A5878]",
            )}
          >
            {statusText}
          </span>
        </span>
        {pending > 0 ? (
          <span
            aria-hidden="true"
            className="grid h-6 min-w-6 place-items-center rounded-full bg-[#C2410C] px-1.5 text-[12px] font-bold text-white"
          >
            {pending}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export default MascotContainer;
