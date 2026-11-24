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
import { ConfirmDialog } from '@components/shared/ConfirmDialog';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';

function EditorLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#14244B] text-[#B8C4E0]">
      <div className="flex items-center gap-2">
        <Loader2 className="size-5 animate-spin text-[#8FA8E8]" aria-hidden="true" />
        <span className="text-sm">{t('room.code.loadingEditor')}</span>
      </div>
    </div>
  );
}

// Dynamic import Monaco Editor with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.default || m.Editor), {
  ssr: false,
  loading: () => <EditorLoading />,
});

/** Badge text for the editor language; Python runs in the browser through Pyodide. */
const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python 3.12 · Pyodide',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  go: 'Go',
  cpp: 'C++',
  csharp: 'C#',
  sql: 'SQL',
};

function languageLabel(language: string): string {
  const key = language.trim().toLowerCase();
  if (LANGUAGE_LABEL[key]) return LANGUAGE_LABEL[key];
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : LANGUAGE_LABEL.python;
}

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
    // Model-facing telemetry, not UI copy: keep it stable for the engine.
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
  const { t } = useLanguage();
  const [code, setCode] = useState<string>(starterCode || '');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
    setConfirmReset(false);
    setCode(starterCode || '');
    setTestOutput(null);
    setTestPassed(null);
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
    setTestOutput(t('room.code.starting'));
    setTestPassed(null);

    try {
      const worker = getWorker();

      const onMessage = (e: MessageEvent<{ success: boolean; output: string }>) => {
        setIsRunning(false);
        setTestPassed(e.data.success);
        setTestOutput(e.data.output || t(e.data.success ? 'room.code.defaultPassed' : 'room.code.defaultFailed'));
        worker.removeEventListener('message', onMessage);
      };

      const onError = (err: ErrorEvent) => {
        setIsRunning(false);
        setTestPassed(false);
        setTestOutput(fmt(t('room.code.workerError'), { reason: err.message || t('room.code.workerFallback') }));
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
      setTestOutput(fmt(t('room.code.workerInit'), { reason: err instanceof Error ? err.message : String(err) }));
    }
  };

  const handleSubmit = () => {
    const diff = computeDiff(starterCode || '', code);
    const passed = testPassed === true;
    onSubmit(code, diff, passed);
  };

  const pillButton =
    'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#1C3270] bg-[#14244B] shadow-[0_28px_60px_-36px_rgba(20,36,75,0.6)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#101D3F] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
            <Code2 className="size-3.5" aria-hidden="true" />
            <span>{languageLabel(language)}</span>
          </div>
          <span className="hidden text-xs text-[#B8C4E0] sm:inline">{t('room.code.title')}</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopyCode} className={pillButton} aria-label={t('room.code.copyAria')}>
            <Copy className="size-3" aria-hidden="true" />
            <span>{copied ? t('room.code.copied') : t('room.code.copy')}</span>
          </button>
          <button type="button" onClick={() => setConfirmReset(true)} className={pillButton} aria-label={t('room.code.resetAria')}>
            <RotateCcw className="size-3" aria-hidden="true" />
            <span>{t('room.code.reset')}</span>
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
      <div className="flex h-44 flex-col border-t border-white/10 bg-[#0E1A38]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#101D3F] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-[#B8C4E0]" aria-hidden="true" />
            <span className="text-xs font-semibold text-white/85">{t('room.code.output')}</span>
            {testPassed === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#287A4B]/30 px-2 py-0.5 text-[11px] font-medium text-[#9FD3B4]">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                {t('room.code.passed')}
              </span>
            )}
            {testPassed === false && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C43B3B]/30 px-2 py-0.5 text-[11px] font-medium text-[#F5C2C2]">
                <XCircle className="size-3" aria-hidden="true" />
                {t('room.code.failed')}
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
              className="rounded-full px-2 text-[11px] text-[#B8C4E0] hover:text-white"
            >
              {t('room.code.clearLog')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-3 font-mono text-xs text-[#E4EAF7]" role="status" aria-live="polite">
          {testOutput ? (
            <pre className="whitespace-pre-wrap leading-relaxed">{testOutput}</pre>
          ) : (
            <div className="flex h-full items-center justify-center italic text-[#8D9BBE]">{t('room.code.emptyOutput')}</div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0E1A38] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[#B8C4E0]">
          {testPassed === null && (
            <span className="flex items-center gap-1.5 text-[#FCB625]">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {t('room.code.notRun')}
            </span>
          )}
          {testPassed === true && (
            <span className="flex items-center gap-1.5 text-[#9FD3B4]">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {t('room.code.ready')}
            </span>
          )}
          {testPassed === false && (
            <span className="flex items-center gap-1.5 text-[#F5C2C2]">
              <XCircle className="size-3.5" aria-hidden="true" />
              {t('room.code.notPassed')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-[#8FA8E8]" aria-hidden="true" />
                <span>{t('room.code.running')}</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-[#FCB625] text-[#FCB625]" aria-hidden="true" />
                <span>{t('room.code.run')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isRunning}
            className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span>{t('room.code.submitting')}</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" aria-hidden="true" />
                <span>{t('room.code.submit')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t('room.code.resetConfirmTitle')}
        body={t('room.code.resetConfirmBody')}
        confirmLabel={t('room.code.reset')}
        cancelLabel={t('room.code.keep')}
        tone="danger"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

export default InteractiveCodeSandbox;
