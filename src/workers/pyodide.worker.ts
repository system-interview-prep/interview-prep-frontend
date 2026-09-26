/**
 * Pyodide WebAssembly Web Worker
 * Runs Python code and test cases client-side inside a sandboxed Web Worker.
 * Zero server cost, zero latency, maximum security.
 */

interface PyodideInterface {
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackagesFromImports?: (code: string) => Promise<unknown>;
}

// Declare Pyodide globals available after loading script
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(config?: { indexURL?: string }): Promise<PyodideInterface>;

interface PyodideRunnerPayload {
  code: string;
  testCode: string;
}

interface PyodideRunnerResponse {
  success: boolean;
  output: string;
}

let pyodideInstance: PyodideInterface | null = null;
let isInitializing = false;
let initPromise: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");
      const pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
      });
      pyodideInstance = pyodide;
      return pyodide;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

self.onmessage = async (event: MessageEvent<PyodideRunnerPayload>) => {
  const { code, testCode } = event.data;
  const stdoutLogs: string[] = [];

  try {
    const pyodide = await getPyodide();

    // Capture standard output and error streams
    pyodide.setStdout({
      batched: (text: string) => {
        stdoutLogs.push(text);
      },
    });
    pyodide.setStderr({
      batched: (text: string) => {
        stdoutLogs.push(`[stderr] ${text}`);
      },
    });

    // Automatically load packages if code requires them
    if (pyodide.loadPackagesFromImports) {
      await pyodide.loadPackagesFromImports(code + "\n" + (testCode || ""));
    }

    // Assemble Python script to run candidate code and test runner
    const executionScript = `
import asyncio
import sys

# 1. Candidate solution code
${code}

# 2. Test cases verification
${testCode || ""}

# 3. Automatic test runner execution
async def _runner():
    if "run_tests" in globals():
        func = globals()["run_tests"]
        if asyncio.iscoroutinefunction(func):
            await func()
        else:
            func()
    else:
        print("Mã nguồn chạy thành công (Không có test case tự động).")

try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        task = asyncio.ensure_future(_runner())
    else:
        asyncio.run(_runner())
except RuntimeError:
    asyncio.run(_runner())
`;

    await pyodide.runPythonAsync(executionScript);

    const logOutput = stdoutLogs.join("\n").trim();
    const finalOutput = logOutput || "✅ TEST PASSED: Tất cả test cases đã vượt qua!";

    const response: PyodideRunnerResponse = {
      success: true,
      output: finalOutput,
    };
    self.postMessage(response);
  } catch (err: unknown) {
    const errorText = err instanceof Error ? err.message : String(err);
    const existingLogs = stdoutLogs.join("\n").trim();
    const combinedOutput = existingLogs
      ? `${existingLogs}\n\n❌ LỖI THỰC THI (TEST FAILED):\n${errorText}`
      : `❌ LỖI THỰC THI (TEST FAILED):\n${errorText}`;

    const response: PyodideRunnerResponse = {
      success: false,
      output: combinedOutput,
    };
    self.postMessage(response);
  }
};

export {};
