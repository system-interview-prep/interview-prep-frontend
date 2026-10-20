"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import FoxAvatar, { type FoxAvatarPose } from "./FoxAvatar";
import type { MascotMood } from "../types";
import type { MascotLine } from "../hooks/useMascotMood";
import { resolveRouteScene } from "../hooks/useMascotMood";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";

// A tip bubble fades after a while so it never sits on top of content.
const BUBBLE_LINGER_MS = 8000;
const SEEN_KEY = "assistant.seen_routes";

const POSE_BY_MOOD: Partial<Record<MascotMood, FoxAvatarPose>> = {
  happy: "sparkle",
  celebrating: "delighted",
  encouraging: "heart",
  coaching: "wink",
};

/** True the first time this route is visited in this browser session. */
function firstVisitThisSession(path: string): boolean {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]"));
    if (seen.has(path)) return false;
    seen.add(path);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    return true;
  } catch {
    return true;
  }
}

/**
 * The fox as the app's assistant: a launcher in the corner that opens a small
 * panel of tips for the current page. It speaks up on its own at most once per
 * page per session (or when the app triggers it), and can be muted.
 */
export function MascotContainer({
  mood = "idle",
  line,
  className,
}: {
  mood?: MascotMood;
  line: MascotLine | null;
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
  const [bubble, setBubble] = useState<MascotLine | null>(null);

  // Route lines: once per page per session. App-triggered lines always show.
  const lastRouteLine = useRef<string | null>(null);
  useEffect(() => {
    if (!line || muted || open) return;
    const isRouteLine = lastRouteLine.current !== pathname;
    lastRouteLine.current = pathname;
    if (isRouteLine && !firstVisitThisSession(pathname)) return;
    queueMicrotask(() => setBubble(line));
    const timer = window.setTimeout(() => setBubble(null), BUBBLE_LINGER_MS);
    return () => window.clearTimeout(timer);
  }, [line, muted, open, pathname]);

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
  const pageLine = scene.speechKey ? t(scene.speechKey) : null;
  const tips = (scene.tipKeys ?? []).map((key) => t(key));
  const pose = POSE_BY_MOOD[mood] ?? "front";

  return (
    <div className={cn("fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6", className)}>
      {open ? (
        <section
          id={panelId}
          role="dialog"
          aria-label={t("assistant.title")}
          className="anim-pop w-[min(340px,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(20,36,75,0.45)] ring-1 ring-[#DCE4F3]"
        >
          <header className="flex items-center gap-3 border-b border-[#EAEFF8] bg-[#F8FAFC] px-4 py-3">
            <FoxAvatar size={36} pose={pose} className="rounded-full bg-white ring-1 ring-[#DCE4F3]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#14244B]">{t("assistant.title")}</p>
              <p className="text-[12px] text-[#607096]">{t("assistant.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label={t("assistant.close")}
              className="grid h-8 w-8 place-items-center rounded-full text-[#607096] transition-colors hover:bg-white hover:text-[#14244B]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6 text-[#14244B]">
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
          </div>
          <footer className="flex flex-wrap items-center gap-2 border-t border-[#EAEFF8] px-4 py-3">
            <Link
              href="/interview/select"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#183275]"
            >
              {t("assistant.start")}
            </Link>
            <Link
              href="/dashboard/help"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#204195] hover:bg-[#F0F4FC]"
            >
              {t("assistant.help")}
            </Link>
            <button
              type="button"
              onClick={() => setMutedRaw(muted ? "0" : "1")}
              aria-pressed={muted}
              className="ml-auto text-[12px] font-medium text-[#607096] underline-offset-4 hover:text-[#14244B] hover:underline"
            >
              {muted ? t("assistant.unmute") : t("assistant.mute")}
            </button>
          </footer>
        </section>
      ) : bubble ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-pop relative hidden max-w-[280px] origin-bottom-right rounded-2xl md:block rounded-br-md bg-white px-4 py-3 pr-8 text-[13.5px] leading-relaxed text-[#14244B] shadow-[0_12px_32px_-12px_rgba(20,36,75,0.35)] ring-1 ring-[#DCE4F3]"
        >
          {bubble.text}
          <button
            type="button"
            onClick={() => setBubble(null)}
            aria-label={t("mascot.dismiss")}
            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
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
        aria-label={open ? t("assistant.close") : t("assistant.open")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title={open ? t("assistant.close") : t("assistant.open")}
        className="group relative grid h-12 w-12 place-items-center rounded-full bg-white shadow-[0_10px_28px_-10px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-95 md:h-14 md:w-14"
      >
        <span className={cn("absolute inset-0 grid place-items-center transition-all duration-200 ease-out", open ? "scale-50 opacity-0" : "scale-100 opacity-100")}>
          <FoxAvatar size={46} pose={pose} />
        </span>
        <span className={cn("absolute inset-0 grid place-items-center text-[#14244B] transition-all duration-200 ease-out", open ? "scale-100 opacity-100" : "scale-50 opacity-0")}>
          <X className="size-5" aria-hidden="true" />
        </span>
        {bubble && !open ? (
          <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#FCB625] ring-2 ring-white" />
        ) : null}
      </button>
    </div>
  );
}

export default MascotContainer;
