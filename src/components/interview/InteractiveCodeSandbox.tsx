'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Terminal,
  XCircle,
} from 'lucide-react';

// Dynamic import Monaco Editor with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.default || m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex items-center gap-2">
        <Loader2 className="size-5 animate-spin text-indigo-400" />
        <span className="text-sm">Đang tải trình soạn thảo Monaco...</span>
      </div>
    </div>
  ),
});

export interface InteractiveCodeSandboxProps {
  starterCode: string;
  language?: string;
  testCode?: string;
  onSubmit: (code: string, codeDiff: string, testPassed: boolean) => void;
  isSubmitting?: boolean;
}

/**
 * Computes a clean unified-style diff between starterCode and modified code
 */
function computeDiff(original: string, modified: string): string {
  if (original.trim() === modified.trim()) {
    return '(Không có thay đổi so với mã nguồn ban đầu)';
  }

  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const diffLines: string[] = ['--- starter_code', '+++ candidate_code'];

  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o !== undefined && m !== undefined) {
      if (o !== m) {
        diffLines.push(`- ${o}`);
        diffLines.push(`+ ${m}`);
      } else {
        diffLines.push(`  ${o}`);
      }
    } else if (o !== undefined) {
      diffLines.push(`- ${o}`);
    } else if (m !== undefined) {
      diffLines.push(`+ ${m}`);
    }
  }

  return diffLines.join('\n');
}

export function InteractiveCodeSandbox({
  starterCode,
  language = 'python',
  testCode = '',
  onSubmit,
  isSubmitting = false,
}: InteractiveCodeSandboxProps) {
  const [code, setCode] = useState<string>(starterCode || '');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);

  const [prevStarterCode, setPrevStarterCode] = useState<string>(starterCode || '');
  if (starterCode && starterCode !== prevStarterCode) {
    setPrevStarterCode(starterCode);
    setCode(starterCode);
  }

  // Clean up Web Worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Initialize or get worker instance
  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../../workers/pyodide.worker.ts', import.meta.url)
      );
    }
    return workerRef.current;
  }, []);

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại code về trạng thái ban đầu?')) {
      setCode(starterCode || '');
      setTestOutput(null);
      setTestPassed(null);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRunTests = () => {
    setIsRunning(true);
    setTestOutput('⏳ Đang khởi tạo môi trường WebAssembly (Pyodide) và chạy test cases...');
    setTestPassed(null);

    try {
      const worker = getWorker();

      const onMessage = (e: MessageEvent<{ success: boolean; output: string }>) => {
        setIsRunning(false);
        setTestPassed(e.data.success);
        setTestOutput(e.data.output || (e.data.success ? 'Test cases passed!' : 'Test failed'));
        worker.removeEventListener('message', onMessage);
      };

      const onError = (err: ErrorEvent) => {
        setIsRunning(false);
        setTestPassed(false);
        setTestOutput(`❌ Lỗi thực thi Worker: ${err.message || 'Không thể chạy Pyodide'}`);
        worker.removeEventListener('error', onError);
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      worker.postMessage({
        code,
        testCode,
      });
    } catch (err: unknown) {
      setIsRunning(false);
      setTestPassed(false);
      setTestOutput(`❌ Không thể khởi tạo Web Worker: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSubmit = () => {
    const diff = computeDiff(starterCode || '', code);
    const passed = testPassed === true;
    onSubmit(code, diff, passed);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
            <Code2 className="size-3.5" />
            <span>Python 3.12 (Pyodide WASM)</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Interactive Code Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            title="Sao chép code"
          >
            <Copy className="size-3" />
            <span>{copied ? 'Đã chép' : 'Chép'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-rose-300"
            title="Đặt lại code ban đầu"
          >
            <RotateCcw className="size-3" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative min-h-0 flex-1">
        <Editor
          height="100%"
          language={language.toLowerCase() === 'python' ? 'python' : language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          }}
        />
      </div>

      {/* Terminal Output Panel */}
      <div className="flex h-44 flex-col border-t border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Terminal Output</span>
            {testPassed === true && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="size-3" />
                Passed
              </span>
            )}
            {testPassed === false && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-medium text-rose-400">
                <XCircle className="size-3" />
                Failed
              </span>
            )}
          </div>
          {testOutput && (
            <button
              type="button"
              onClick={() => {
                setTestOutput(null);
                setTestPassed(null);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Xóa log
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-3 font-mono text-xs text-slate-200">
          {testOutput ? (
            <pre className="whitespace-pre-wrap leading-relaxed">{testOutput}</pre>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 italic">
              Bấm [Chạy thử] để kiểm tra code với test cases tự động.
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {testPassed === null && (
            <span className="flex items-center gap-1.5 text-amber-400/90">
              <AlertTriangle className="size-3.5" />
              Chưa chạy test cases
            </span>
          )}
          {testPassed === true && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Sẵn sàng nộp bài cho AI
            </span>
          )}
          {testPassed === false && (
            <span className="flex items-center gap-1.5 text-rose-400">
              <XCircle className="size-3.5" />
              Test chưa đạt, bạn có thể sửa lại và chạy tiếp
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:border-slate-600 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-indigo-400" />
                <span>Đang chạy test...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 text-emerald-400 fill-emerald-400" />
                <span>Chạy thử (Run Test)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isRunning}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang nộp...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Nộp bài cho AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InteractiveCodeSandbox;
