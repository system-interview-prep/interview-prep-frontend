"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import {
  interviewReportApi,
  type EvaluationReport,
} from "@/features/interview/services/interviewReport.service";
import InterviewReportView from "@/features/interview/components/InterviewReportView";

export default function InterviewResultsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const sessionId =
    (routeParams?.id as string) ||
    searchParams.get("sessionId")?.trim() ||
    "";

  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = async (autoEvaluateOn404 = true) => {
    if (!sessionId) {
      setError("Không tìm thấy mã phiên phỏng vấn (sessionId).");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await interviewReportApi.getEvaluation(sessionId);
      setReport(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 && autoEvaluateOn404) {
        // Chưa có báo cáo -> Tự động trigger đánh giá
        await triggerEvaluate();
        return;
      }

      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === "string"
          ? resData.detail
          : err instanceof Error
          ? err.message
          : "Không thể tải báo cáo đánh giá.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const triggerEvaluate = async () => {
    if (!sessionId) return;
    setEvaluating(true);
    setError(null);
    try {
      const data = await interviewReportApi.evaluateSession(sessionId);
      setReport(data);
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === "string"
          ? resData.detail
          : err instanceof Error
          ? err.message
          : "Không thể tổng hợp báo cáo đánh giá. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setEvaluating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Quay lại bảng điều khiển"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-[#14244B]">
              INTERVIA
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
              Evaluation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition"
            >
              <FileCheck className="size-3.5" /> In / Lưu PDF
            </button>
          )}
          <Link
            href="/interview/select"
            className="rounded-xl bg-[#204195] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#183273] transition shadow-2xs"
          >
            Luyện tập tiếp
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        {loading || evaluating ? (
          <div className="mx-auto max-w-md py-24 text-center px-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs border border-indigo-100">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {evaluating
                ? "AI đang đánh giá buổi phỏng vấn..."
                : "Đang tải dữ liệu đánh giá..."}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Hệ thống đang bóc tách mô hình STAR, kiểm định Rubric và trích xuất bằng chứng câu trả lời để tạo báo cáo chuẩn xác nhất.
            </p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-xs text-center space-y-4 my-16">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Chưa thể tải báo cáo đánh giá
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => triggerEvaluate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183273] transition"
              >
                <Sparkles className="size-3.5" /> Tạo lại báo cáo AI
              </button>
              <button
                onClick={() => fetchEvaluation(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <RefreshCw className="size-3.5" /> Tải lại trang
              </button>
            </div>
          </div>
        ) : report ? (
          <InterviewReportView
            report={report}
            onBack={() => router.push("/dashboard")}
          />
        ) : null}
      </main>
    </div>
  );
}
