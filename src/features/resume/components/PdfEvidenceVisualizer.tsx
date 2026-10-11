"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { downloadCvPdf } from "@/lib/aiService";
import { useLanguage } from "@/i18n/LanguageProvider";

interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PdfPageProps {
  pdf: any;
  pageNum: number;
  matchedSnippets: string[];
  enableTextSelection: boolean;
  onPageRendered: (pageNum: number, textLayerElement: HTMLDivElement | null) => void;
  onSnippetsFound?: (pageNum: number, found: string[]) => void;
}

const PdfPage = ({ pdf, pageNum, matchedSnippets, enableTextSelection, onPageRendered, onSnippetsFound }: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<HighlightBox[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let active = true;

    async function renderPage() {
      try {
        const page = await pdf.getPage(pageNum);
        if (!active) return;

        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setDimensions({ width: viewport.width, height: viewport.height });

        // Render Canvas
        await page.render({ canvasContext: context, viewport }).promise;
        if (!active) return;

        const textContent = await page.getTextContent();
        if (!active) return;

        // Render Text Layer (only if enabled for text selection/copying)
        const textLayer = textLayerRef.current;
        if (textLayer) {
          textLayer.innerHTML = "";
          if (enableTextSelection) {
            textLayer.style.height = `${viewport.height}px`;
            textLayer.style.width = `${viewport.width}px`;

            const pdfJS = await import("pdfjs-dist");

            const textLayerObj = new pdfJS.TextLayer({
              textContentSource: textContent,
              container: textLayer,
              viewport,
            });

            await textLayerObj.render();
          }
        }
        if (!active) return;

        // Calculate highlights coordinates using viewport transformation matrix (1C & 2A)
        const foundHighlights: HighlightBox[] = [];
        const foundSnippets: string[] = [];
        const items = textContent.items;

        for (const snippet of matchedSnippets) {
          const cleanSnippet = snippet.toLowerCase().trim();
          if (cleanSnippet.length < 2) continue;
          const before = foundHighlights.length;

          for (const item of items) {
            if (!item.str) continue;
            const itemText = item.str.toLowerCase();

            if (itemText.includes(cleanSnippet)) {
              const tx = item.transform; // [scaleX, skewX, skewY, scaleY, translateX, translateY]
              const x = tx[4];
              const y = tx[5];

              // Convert PDF-space coordinates to absolute viewport pixels
              const [left, top] = viewport.convertToViewportPoint(x, y);
              const [right, bottom] = viewport.convertToViewportPoint(x + item.width, y + item.height);

              foundHighlights.push({
                left: Math.min(left, right),
                top: Math.min(top, bottom),
                width: Math.max(1, Math.abs(right - left)),
                height: Math.max(1, Math.abs(bottom - top)),
              });
            }
          }
          if (foundHighlights.length > before) foundSnippets.push(snippet);
        }

        setHighlights(foundHighlights);
        onSnippetsFound?.(pageNum, foundSnippets);

        // Notify parent
        onPageRendered(pageNum, textLayerRef.current);

      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [pdf, pageNum, matchedSnippets, enableTextSelection, onPageRendered, onSnippetsFound]);

  return (
    <div
      ref={containerRef}
      data-pdf-page={pageNum}
      className="relative mx-auto mb-6 overflow-hidden rounded-2xl bg-white ring-1 ring-[#DCE4F3]"
      style={{
        width: dimensions.width || "auto",
        height: dimensions.height || "auto",
        maxWidth: "max-content",
      }}
    >
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="block" />

      {/* SVG Highlight Overlay (1C & 2A) */}
      {dimensions.width > 0 && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          {highlights.map((h, idx) => (
            <rect
              key={idx}
              x={h.left}
              y={h.top}
              width={h.width}
              height={h.height}
              fill="rgba(16, 185, 129, 0.28)" // Soft Translucent Green
              stroke="#10b981" // Green Border
              strokeWidth="1.5"
              rx="2"
            />
          ))}
        </svg>
      )}

      {/* HTML Selection Text Layer */}
      {enableTextSelection && (
        <div
          ref={textLayerRef}
          className="textLayer absolute inset-0 select-text z-20 pointer-events-auto"
        />
      )}
    </div>
  );
};

interface PdfEvidenceVisualizerProps {
  candidateId: string;
  matchedSnippets: string[];
  scrollToSnippet?: string | null;
  onScrollToSnippetEnd?: () => void;
  /**
   * Reports which snippets were located on at least one page. Snippets are
   * matched against single PDF text items, so a span that wraps lines or was
   * normalized by the parser may not be found; callers should say so.
   */
  onLocatedChange?: (located: Set<string>) => void;
  /** Scroll to the first page holding a highlight whenever the snippets change. */
  autoScrollToFirstHit?: boolean;
}

export default function PdfEvidenceVisualizer({
  candidateId,
  matchedSnippets,
  scrollToSnippet,
  onScrollToSnippetEnd,
  onLocatedChange,
  autoScrollToFirstHit = false,
}: PdfEvidenceVisualizerProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enableTextSelection, setEnableTextSelection] = useState(false);

  useEffect(() => {
    if (!candidateId) return;

    let isMounted = true;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const pdfJS = await import("pdfjs-dist");
        pdfJS.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const arrayBuffer = await downloadCvPdf(candidateId);
        if (!isMounted) return;

        const loadingTask = pdfJS.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch (err: unknown) {
        console.error("Error rendering PDF:", err);
        // An empty message falls back to a translated sentence at render time.
        const errMsg = err instanceof Error ? err.message : "";
        if (isMounted) setError(errMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!scrollToSnippet || !containerRef.current) return;

    const lowercaseSnippet = scrollToSnippet.toLowerCase().trim();
    if (!lowercaseSnippet) return;

    const spans = containerRef.current.querySelectorAll("span");
    let foundSpan: HTMLSpanElement | null = null;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const text = span.textContent?.toLowerCase() || "";
      if (text.includes(lowercaseSnippet) || lowercaseSnippet.includes(text)) {
        foundSpan = span;
        break;
      }
    }

    if (foundSpan) {
      foundSpan.scrollIntoView({ behavior: "smooth", block: "center" });

      const originalBg = foundSpan.style.backgroundColor;
      const originalBorder = foundSpan.style.borderBottom;

      foundSpan.style.backgroundColor = "rgba(245, 158, 11, 0.45)"; // Highlight Amber
      foundSpan.style.borderBottom = "2px solid #f59e0b";

      setTimeout(() => {
        if (foundSpan) {
          foundSpan.style.backgroundColor = originalBg;
          foundSpan.style.borderBottom = originalBorder;
        }
      }, 2000);
    }

    if (onScrollToSnippetEnd) {
      onScrollToSnippetEnd();
    }
  }, [scrollToSnippet, onScrollToSnippetEnd]);

  const handlePageRendered = useCallback((_pageNum: number, _el: HTMLDivElement | null) => {
    // optional page logging
  }, []);

  // Which snippets each page located, reset whenever the snippet set changes.
  const foundByPageRef = useRef<Map<number, string[]>>(new Map());
  const scrolledForRef = useRef<string[] | null>(null);
  useEffect(() => {
    foundByPageRef.current = new Map();
    scrolledForRef.current = null;
    onLocatedChange?.(new Set());
  }, [matchedSnippets, onLocatedChange]);

  const handleSnippetsFound = useCallback(
    (pageNum: number, found: string[]) => {
      foundByPageRef.current.set(pageNum, found);
      const located = new Set([...foundByPageRef.current.values()].flat());
      onLocatedChange?.(located);
      if (!autoScrollToFirstHit || scrolledForRef.current === matchedSnippets) return;
      const pagesWithHits = [...foundByPageRef.current.entries()]
        .filter(([, hits]) => hits.length > 0)
        .map(([page]) => page);
      if (pagesWithHits.length === 0) return;
      const firstPage = Math.min(...pagesWithHits);
      const target = containerRef.current?.querySelector(`[data-pdf-page="${firstPage}"]`);
      if (target) {
        scrolledForRef.current = matchedSnippets;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [autoScrollToFirstHit, matchedSnippets, onLocatedChange]
  );

  return (
    <div className="relative flex flex-col items-center w-full h-full min-h-[35rem] max-h-[45rem] overflow-y-auto bg-[#F0F4FC] p-4 rounded-3xl border border-[#DCE4F3]">
      <style dangerouslySetInnerHTML={{
        __html: `
        .textLayer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.28;
          line-height: 1.0;
        }
        .textLayer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer mark {
          color: transparent;
        }
      `}} />

      {/* Toolbar */}
      {!loading && error === null && (
        <div className="w-full flex justify-end mb-4 px-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#607096] bg-white ring-1 ring-[#DCE4F3] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#F8FAFC] transition-colors">
            <input
              type="checkbox"
              checked={enableTextSelection}
              onChange={(e) => setEnableTextSelection(e.target.checked)}
              className="accent-[#204195]"
            />
            <span>{t("picker.pdf.textSelection")}</span>
          </label>
        </div>
      )}

      {loading ? (
        <div className="my-auto flex flex-col items-center">
          <Loader2 className="size-9 animate-spin text-[#9AA6C2]" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-[#607096]">{t("picker.pdf.loading")}</p>
        </div>
      ) : error !== null ? (
        <div className="my-auto max-w-sm rounded-2xl bg-[#FDF2F2] p-5 text-center">
          <p className="text-sm font-semibold text-[#C43B3B]">{t("picker.pdf.renderError")}</p>
          <p className="mt-1 text-xs text-[#607096]">{error || t("picker.pdf.renderErrorFallback")}</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full">
          {Array.from({ length: numPages }).map((_, index) => (
            <PdfPage
              key={index}
              pdf={pdf}
              pageNum={index + 1}
              matchedSnippets={matchedSnippets}
              enableTextSelection={enableTextSelection}
              onPageRendered={handlePageRendered}
              onSnippetsFound={handleSnippetsFound}
            />
          ))}
        </div>
      )}
    </div>
  );
}

