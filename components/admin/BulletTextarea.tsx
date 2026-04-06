"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ListStyleId =
  | "bullet"
  | "circle"
  | "square"
  | "dash"
  | "plus"
  | "number"
  | "letterParen"
  | "letterDot";

const BULLET_STYLES: { id: ListStyleId; preview: string; title: string }[] = [
  { id: "bullet", preview: "•", title: "Bullet" },
  { id: "circle", preview: "○", title: "Circle" },
  { id: "square", preview: "▪", title: "Square" },
  { id: "dash", preview: "-", title: "Dash -" },
  { id: "plus", preview: "+", title: "Plus +" },
];

const NUMBER_STYLES: { id: ListStyleId; preview: string; title: string }[] = [
  { id: "number", preview: "1.", title: "1. 2. 3." },
  { id: "letterParen", preview: "a)", title: "a) b) c)" },
  { id: "letterDot", preview: "a.", title: "a. b. c." },
];

function firstLinePrefix(style: ListStyleId): string {
  switch (style) {
    case "bullet":
      return "• ";
    case "circle":
      return "○ ";
    case "square":
      return "▪ ";
    case "dash":
      return "- ";
    case "plus":
      return "+ ";
    case "number":
      return "1. ";
    case "letterParen":
      return "a) ";
    case "letterDot":
      return "a. ";
    default:
      return "• ";
  }
}

/** Next line prefix after Enter, based on chosen style and the line the cursor was on. */
function nextLinePrefix(style: ListStyleId, currentLine: string): string {
  switch (style) {
    case "bullet":
      return "• ";
    case "circle":
      return "○ ";
    case "square":
      return "▪ ";
    case "dash":
      return "- ";
    case "plus":
      return "+ ";
    case "number": {
      const m = currentLine.match(/^\s*(\d+)\.\s*/);
      const n = m ? parseInt(m[1], 10) + 1 : 1;
      return `${n}. `;
    }
    case "letterParen": {
      const m = currentLine.match(/^\s*([a-z])\)\s*/i);
      if (m) {
        const code = m[1].toLowerCase().charCodeAt(0);
        if (code < "z".charCodeAt(0)) {
          return `${String.fromCharCode(code + 1)}) `;
        }
      }
      return "a) ";
    }
    case "letterDot": {
      const m = currentLine.match(/^\s*([a-z])\.\s*/i);
      if (m) {
        const code = m[1].toLowerCase().charCodeAt(0);
        if (code < "z".charCodeAt(0)) {
          return `${String.fromCharCode(code + 1)}. `;
        }
      }
      return "a. ";
    }
    default:
      return "• ";
  }
}

/** Strip common list markers for “is there real content?” checks. */
export function stripListPrefix(line: string): string {
  let s = line;
  s = s.replace(/^\s*[•○▪]\s*/, "");
  s = s.replace(/^\s*\+\s*/, "");
  s = s.replace(/^\s*[–\-]\s*/, "");
  s = s.replace(/^\s*\d+\.\s*/, "");
  s = s.replace(/^\s*[a-z]\)\s*/i, "");
  s = s.replace(/^\s*[a-z]\.\s*/i, "");
  return s.trim();
}

export type BulletTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (next: string) => void;
};

/** If the field only contains empty list lines, treat as empty when saving. */
export function normalizeBulletFieldForSave(s: string): string | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const lines = t.split(/\n/);
  const hasReal = lines.some((line) => stripListPrefix(line).length > 0);
  if (!hasReal) return undefined;
  return t;
}

function lineIndexAtCursor(value: string, cursor: number): number {
  return value.slice(0, cursor).split("\n").length - 1;
}

function getLine(value: string, index: number): string {
  const lines = value.split("\n");
  return lines[index] ?? "";
}

function isEffectivelyEmptyList(value: string): boolean {
  if (!value.trim()) return true;
  return value.split("\n").every((line) => stripListPrefix(line) === "");
}

function isBulletStyle(id: ListStyleId): boolean {
  return BULLET_STYLES.some((b) => b.id === id);
}

/** Prefix for line `index` (0-based) when reformatting a whole block. */
function listPrefixAtIndex(style: ListStyleId, index: number): string {
  switch (style) {
    case "bullet":
      return "• ";
    case "circle":
      return "○ ";
    case "square":
      return "▪ ";
    case "dash":
      return "- ";
    case "plus":
      return "+ ";
    case "number":
      return `${index + 1}. `;
    case "letterParen":
      return `${String.fromCharCode("a".charCodeAt(0) + (index % 26))}) `;
    case "letterDot":
      return `${String.fromCharCode("a".charCodeAt(0) + (index % 26))}. `;
    default:
      return "• ";
  }
}

/**
 * Reformat every line in the selection block: strip old list markers, apply `style`.
 * Selection is expanded to full lines (works with Ctrl+A).
 */
function applyListStyleToSelection(
  value: string,
  selStart: number,
  selEnd: number,
  style: ListStyleId
): { next: string; selectStart: number; selectEnd: number } {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  const startLine = lineIndexAtCursor(value, a);
  const endLine = a === b ? startLine : lineIndexAtCursor(value, b === 0 ? 0 : b - 1);
  const lines = value.split("\n");

  const blockLines = lines.slice(startLine, endLine + 1);
  const transformed = blockLines.map((line, i) => {
    const content = stripListPrefix(line);
    return listPrefixAtIndex(style, i) + content;
  });
  const newBlock = transformed.join("\n");

  let blockStart = 0;
  for (let i = 0; i < startLine; i++) blockStart += lines[i].length + 1;
  let blockLen = 0;
  for (let i = startLine; i <= endLine; i++) {
    blockLen += lines[i].length;
    if (i < endLine) blockLen += 1;
  }
  const blockEnd = blockStart + blockLen;

  const next = value.slice(0, blockStart) + newBlock + value.slice(blockEnd);
  return { next, selectStart: blockStart, selectEnd: blockStart + newBlock.length };
}

type MenuOpen = "bullets" | "numbers" | null;

/** Keeps toolbar clicks from stealing focus so textarea selection survives until apply. */
function preventTakeFocus(e: React.MouseEvent) {
  e.preventDefault();
}

function IconBullets({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
    </svg>
  );
}

function IconNumbered({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm0-5h1.8L2 13.1v.9h3v-1H3.3L5 10.5V10H2v1zm5-6v2h14V6H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

/**
 * Textarea with Word-like list pickers (bullet / numbering libraries). Enter continues the active list style.
 */
export function BulletTextarea({
  value,
  onChange,
  onFocus,
  onKeyDown,
  onBlur,
  className,
  ...rest
}: BulletTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pendingSel = useRef<number | { start: number; end: number } | null>(null);
  const savedSelection = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const [listStyle, setListStyle] = useState<ListStyleId>("bullet");
  const [menuOpen, setMenuOpen] = useState<MenuOpen>(null);

  useLayoutEffect(() => {
    if (pendingSel.current == null || !ref.current) return;
    const p = pendingSel.current;
    pendingSel.current = null;
    if (typeof p === "number") ref.current.setSelectionRange(p, p);
    else ref.current.setSelectionRange(p.start, p.end);
  }, [value]);

  useEffect(() => {
    if (menuOpen == null) return;
    const onDoc = (e: MouseEvent) => {
      const el = toolbarRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const handleFocus: React.FocusEventHandler<HTMLTextAreaElement> = (e) => {
    if (value === "") onChange(firstLinePrefix(listStyle));
    onFocus?.(e);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const lineIdx = lineIndexAtCursor(value, start);
      const currentLine = getLine(value, lineIdx);
      const insert = "\n" + nextLinePrefix(listStyle, currentLine);
      const next = value.slice(0, start) + insert + value.slice(end);
      pendingSel.current = start + insert.length;
      onChange(next);
      return;
    }
    onKeyDown?.(e);
  };

  const applyStyle = (id: ListStyleId) => {
    setListStyle(id);
    setMenuOpen(null);

    const el = ref.current;
    let start = el?.selectionStart ?? 0;
    let end = el?.selectionEnd ?? 0;
    if (!el || document.activeElement !== el) {
      start = savedSelection.current.start;
      end = savedSelection.current.end;
    }

    if (isEffectivelyEmptyList(value)) {
      onChange(firstLinePrefix(id));
      pendingSel.current = firstLinePrefix(id).length;
      return;
    }

    const { next, selectStart, selectEnd } = applyListStyleToSelection(value, start, end, id);
    onChange(next);
    pendingSel.current = { start: selectStart, end: selectEnd };
  };

  const tileClass = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-lg border text-base font-semibold transition-colors ${
      active
        ? "border-primary bg-primary/15 text-primary ring-2 ring-primary/25"
        : "border-outline-variant/30 bg-surface hover:bg-surface-container-highest"
    }`;

  const toolbar = (
    <div ref={toolbarRef} className="relative mb-2 flex flex-wrap items-center gap-1">
      <div className="relative inline-flex rounded-xl border border-outline-variant/20 bg-surface-container-high/60 p-0.5">
        <button
          type="button"
          className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
            menuOpen === "bullets" || isBulletStyle(listStyle)
              ? "bg-primary/15 text-primary"
              : "text-on-surface hover:bg-surface-container-highest"
          }`}
          title="Bullet Library"
          aria-expanded={menuOpen === "bullets"}
          aria-haspopup="dialog"
          onMouseDown={preventTakeFocus}
          onClick={() => setMenuOpen((m) => (m === "bullets" ? null : "bullets"))}
        >
          <IconBullets className="shrink-0" />
          <Chevron open={menuOpen === "bullets"} />
        </button>
        {menuOpen === "bullets" && (
          <div
            role="dialog"
            aria-label="Bullet Library"
            className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-outline-variant/25 bg-surface p-3 shadow-lg"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Bullet Library</div>
            <div className="grid grid-cols-4 gap-1.5">
              {BULLET_STYLES.map(({ id, preview, title }) => (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onMouseDown={preventTakeFocus}
                  onClick={() => applyStyle(id)}
                  className={tileClass(listStyle === id)}
                >
                  {preview}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative inline-flex rounded-xl border border-outline-variant/20 bg-surface-container-high/60 p-0.5">
        <button
          type="button"
          className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
            menuOpen === "numbers" || !isBulletStyle(listStyle)
              ? "bg-primary/15 text-primary"
              : "text-on-surface hover:bg-surface-container-highest"
          }`}
          title="Numbering Library"
          aria-expanded={menuOpen === "numbers"}
          aria-haspopup="dialog"
          onMouseDown={preventTakeFocus}
          onClick={() => setMenuOpen((m) => (m === "numbers" ? null : "numbers"))}
        >
          <IconNumbered className="shrink-0" />
          <Chevron open={menuOpen === "numbers"} />
        </button>
        {menuOpen === "numbers" && (
          <div
            role="dialog"
            aria-label="Numbering Library"
            className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-outline-variant/25 bg-surface p-3 shadow-lg"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Numbering Library</div>
            <div className="grid grid-cols-3 gap-1.5">
              {NUMBER_STYLES.map(({ id, preview, title }) => (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onMouseDown={preventTakeFocus}
                  onClick={() => applyStyle(id)}
                  className={tileClass(listStyle === id)}
                >
                  {preview}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {toolbar}
      <textarea
        ref={ref}
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={(e) => {
          const t = e.currentTarget;
          savedSelection.current = { start: t.selectionStart, end: t.selectionEnd };
        }}
        onBlur={(e) => {
          savedSelection.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
          onBlur?.(e);
        }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={className}
      />
    </div>
  );
}
