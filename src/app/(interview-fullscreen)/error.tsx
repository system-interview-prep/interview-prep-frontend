"use client";

import { useEffect } from "react";
import Link from "next/link";
import { VideoOff, RotateCcw } from "lucide-react";

export default function InterviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Interview Fullscreen Error Boundary Caught Exception:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-2xl border border-red-500/20 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <VideoOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="mb-2 font-headline text-xl font-bold text-white">
          Sự cố kết nối phòng phỏng vấn
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          Không thể khởi tạo hoặc duy trì kết nối âm thanh/hình ảnh. Vui lòng kiểm tra quyền truy cập Microphone/Camera và kết nối mạng.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <RotateCcw className="w-4 h-4" />
            Thử kết nối lại
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
          >
            Quay lại Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
