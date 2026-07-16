"use client";

import { useEffect, useRef, useState } from "react";
import { downloadCvPdf } from "@/lib/aiService";

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
}

const PdfPage = ({ pdf, pageNum, matchedSnippets, enableTextSelection, onPageRendered }: PdfPageProps) => {
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
        const items = textContent.items;

        for (const snippet of matchedSnippets) {
          const cleanSnippet = snippet.toLowerCase().trim();
          if (cleanSnippet.length < 2) continue;

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
        }

        setHighlights(foundHighlights);

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
  }, [pdf, pageNum, matchedSnippets, enableTextSelection]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mb-6 shadow-lg border border-slate-200/60 bg-white rounded-xl overflow-hidden"
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
}

export default function PdfEvidenceVisualizer({
  candidateId,
  matchedSnippets,
  scrollToSnippet,
  onScrollToSnippetEnd,
}: PdfEvidenceVisualizerProps) {
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
      } catch (err: any) {
        console.error("Error rendering PDF:", err);
        if (isMounted) setError(err.message || "Failed to render PDF");
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
  }, [scrollToSnippet]);

  const handlePageRendered = (pageNum: number, el: HTMLDivElement | null) => {
    // optional page logging
  };

  return (
    <div className="relative flex flex-col items-center w-full h-full min-h-[35rem] max-h-[45rem] overflow-y-auto bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80">
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
      {!loading && !error && (
        <div className="w-full flex justify-end mb-4 px-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white shadow-sm border border-slate-200/60 rounded-full px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={enableTextSelection}
              onChange={(e) => setEnableTextSelection(e.target.checked)}
              className="accent-emerald-600"
            />
            <span>Cho phép chọn văn bản (Copy Text)</span>
          </label>
        </div>
      )}

      {loading ? (
        <div className="my-auto flex flex-col items-center">
          <span className="material-symbols-outlined animate-spin text-[36px] text-slate-400">progress_activity</span>
          <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải và highlight CV...</p>
        </div>
      ) : error ? (
        <div className="my-auto text-center p-6">
          <span className="material-symbols-outlined text-[40px] text-amber-500">warning</span>
          <p className="mt-2 text-sm font-bold text-slate-700">Không thể kết xuất PDF của CV</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

