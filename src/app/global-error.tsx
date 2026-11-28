"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary: it replaces the root layout, so it renders its own
 * <html>/<body> and cannot rely on the language provider (copy is in
 * Vietnamese, the only UI language).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  const secondary =
    "inline-flex h-11 items-center justify-center rounded-full border border-[#DCE4F3] bg-white px-6 text-sm font-semibold text-[#14244B] transition hover:bg-[#F0F4FC]";

  return (
    <html lang="vi">
      <body style={{ margin: 0, background: "#F8FAFC", color: "#14244B", fontFamily: "system-ui, sans-serif" }}>
        <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12">
          <div role="alert" className="w-full max-w-md rounded-3xl border border-[#DCE4F3] bg-white p-8 text-center">
            <p className="text-lg font-semibold text-[#204195]">Intervia</p>
            <h1 className="mt-4 text-2xl font-semibold text-[#14244B]">Đã có lỗi xảy ra</h1>
            <p className="mt-3 text-sm leading-6 text-[#607096]">
              Ứng dụng gặp sự cố ngoài dự kiến. Bạn có thể thử lại hoặc quay về trang chủ. Nếu lỗi lặp lại, hãy gửi email tới
              support@intervia.io.
            </p>
            {error.digest ? <p className="mt-2 text-xs text-[#607096]">Mã lỗi: {error.digest}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
              >
                Thử lại
              </button>
              {/* Plain anchors: a full reload is the safest way out of a root-level crash. */}
              <a href="/dashboard" className={secondary}>
                Về bảng điều khiển
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className={secondary}>
                Về trang chủ
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
