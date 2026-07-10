"use client";

import { useEffect, useRef, useState } from "react";
import { downloadCvPdf } from "@/lib/aiService";

interface PdfPageProps {
  pdf: any;
  pageNum: number;
  matchedSnippets: string[];
  onPageRendered: (pageNum: number, textLayerElement: HTMLDivElement) => void;
}

const PdfPage = ({ pdf, pageNum, matchedSnippets, onPageRendered }: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

        // Render Canvas
        await page.render({ canvasContext: context, viewport }).promise;
        if (!active) return;

        // Render Text Layer
        const textLayer = textLayerRef.current;
        if (!textLayer) return;

        textLayer.innerHTML = "";
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.width = `${viewport.width}px`;

        const textContent = await page.getTextContent();
        if (!active) return;

        const pdfJS = await import("pdfjs-dist");

        const textLayerObj = new pdfJS.TextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport,
        });

        await textLayerObj.render();

        if (!active) return;

        // Highlight matching text layer spans
        highlightSpans(textLayer, matchedSnippets);

        // Notify parent
        onPageRendered(pageNum, textLayer);

      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [pdf, pageNum, matchedSnippets]);

  return (
    <div ref={containerRef} className="relative mx-auto mb-6 shadow-lg border border-slate-200/60 bg-white rounded-xl overflow-hidden" style={{ maxWidth: "max-content" }}>
      <canvas ref={canvasRef} className="block" />
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 select-text"
        style={{ pointerEvents: "auto" }}
      />
    </div>
  );
};

function highlightSpans(container: HTMLDivElement, snippets: string[]) {
  if (!snippets.length) return;
  const spans = container.querySelectorAll("span");
  spans.forEach((span) => {
    const text = span.textContent?.toLowerCase() || "";
    if (text.trim().length < 2) return;

    snippets.forEach((snippet) => {
      const cleanSnippet = snippet.toLowerCase().trim();
      if (cleanSnippet.length < 2) return;

      if (text.includes(cleanSnippet) || (cleanSnippet.includes(text) && text.length > 3)) {
        span.style.backgroundColor = "rgba(16, 185, 129, 0.28)"; // Soft Translucent Green
        span.style.borderBottom = "2px solid #10b981";
        span.style.borderRadius = "2px";
        span.setAttribute("data-snippet", cleanSnippet);
      }
    });
  });
}

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

  const handlePageRendered = (pageNum: number, el: HTMLDivElement) => {
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
              onPageRendered={handlePageRendered}
            />
          ))}
        </div>
      )}
    </div>
  );
}
