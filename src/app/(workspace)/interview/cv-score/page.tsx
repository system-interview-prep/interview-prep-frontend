"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lightbulb, RefreshCw, ShieldAlert, Target, XCircle } from "lucide-react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { scoreCvAgainstJobProfile, type CvScoringResponse } from "@/lib/aiService";

function ScorePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const candidateId = params.get("candidateId")?.trim() ?? "";
  const jobId = params.get("jobId")?.trim() ?? "";
  const jobTitle = params.get("jobTitle")?.trim() || "Job profile";
  const [result, setResult] = useState<CvScoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadScore = useCallback(async () => {
    if (!candidateId || !jobId) {
      setError("Thiếu CV hoặc job profile. Vui lòng quay lại và chọn đủ thông tin.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await scoreCvAgainstJobProfile({ candidateId, jobId }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể chấm điểm CV lúc này.");
    } finally {
      setLoading(false);
    }
  }, [candidateId, jobId]);

  useEffect(() => { void loadScore(); }, [loadScore]);

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <button type="button" onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#607096] hover:text-[#204195]">
            <ArrowLeft className="size-4" /> Quay lại
          </button>
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5572B8]">CV match report</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Mức độ phù hợp với {jobTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607096]">Báo cáo này giúp bạn hiểu CV đang đáp ứng yêu cầu nào và nên cải thiện điểm nào trước khi ứng tuyển.</p>
          </header>

          {loading && <div className="rounded-2xl border border-[#DCE4F3] bg-white p-10 text-center text-[#607096]">Đang phân tích CV và job profile…</div>}
          {!loading && error && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
              <div className="flex items-start gap-3"><XCircle className="mt-0.5 size-5 shrink-0 text-red-600" /><div><h2 className="font-bold text-red-900">Không thể tạo báo cáo</h2><p className="mt-1 text-sm text-red-800">{error}</p><button type="button" onClick={() => void loadScore()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"><RefreshCw className="size-4" /> Thử lại</button></div></div>
            </section>
          )}
          {!loading && !error && result && <Report result={result} />}
        </div>
      </main>
    </UserDashboardShell>
  );
}

function Report({ result }: { result: CvScoringResponse }) {
  const percentage = Math.max(0, Math.min(100, Math.round(result.score.percentage)));
  const passed = result.hardFilters.passed && result.decision === "PASS";
  const list = (items: string[], empty: string) => items.length ? <ul className="space-y-2 text-sm leading-6 text-[#425477]">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#5572B8]" />{item}</li>)}</ul> : <p className="text-sm text-[#7A89A8]">{empty}</p>;
  return <div className="space-y-6">
    <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 text-center shadow-xs"><div className="mx-auto flex size-40 items-center justify-center rounded-full border-[14px] border-[#E7EDFA]" style={{ borderTopColor: percentage >= 70 ? "#16A34A" : percentage >= 45 ? "#F59E0B" : "#DC2626" }}><div><div className="text-4xl font-extrabold">{percentage}%</div><div className="text-xs font-semibold text-[#7A89A8]">phù hợp</div></div></div><p className={`mt-4 font-bold ${passed ? "text-emerald-700" : "text-red-700"}`}>{passed ? "Có thể tiếp tục" : "Cần xem lại"}</p></div>
      <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs"><div className="flex items-start gap-3"><div className={`rounded-xl p-3 ${passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{passed ? <CheckCircle2 className="size-6" /> : <ShieldAlert className="size-6" />}</div><div><h2 className="text-xl font-bold">{passed ? "CV đáp ứng phần lớn yêu cầu" : "Có yêu cầu quan trọng cần bổ sung"}</h2><p className="mt-2 text-sm leading-6 text-[#607096]">{result.overallFeedback || "Kết quả được tổng hợp từ yêu cầu bắt buộc, kỹ năng và bằng chứng trong CV."}</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Điểm tổng" value={`${result.score.raw.toFixed(1)}/${result.score.max}`} /><Metric label="Fit band" value={result.fitBand.replaceAll("_", " ")} /><Metric label="Hard filter" value={result.hardFilters.passed ? "Đạt" : "Chưa đạt"} /></div></div>
    </section>
    <section className="grid gap-6 md:grid-cols-3"><Insight title="Điểm mạnh" icon={<CheckCircle2 className="size-5 text-emerald-600" />} content={list(result.summary.strengths, "Chưa có điểm mạnh được ghi nhận.")} /><Insight title="Khoảng trống" icon={<Target className="size-5 text-amber-600" />} content={list(result.summary.weaknesses, "Không phát hiện khoảng trống rõ ràng.")} /><Insight title="Gợi ý cải thiện" icon={<Lightbulb className="size-5 text-blue-600" />} content={list(result.summary.suggestions, "Chưa có gợi ý bổ sung.")} /></section>
    {result.hardFilters.reasons.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-bold text-amber-900">Yêu cầu cần lưu ý</h2><div className="mt-3">{list(result.hardFilters.reasons, "")}</div></section>}
    <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs"><h2 className="text-xl font-bold">Phân tích theo tiêu chí</h2><div className="mt-5 space-y-4">{result.criteriaBreakdown.length ? result.criteriaBreakdown.map((criterion, index) => <div key={`${criterion.name}-${index}`}><div className="flex justify-between gap-4 text-sm"><span className="font-semibold">{criterion.name}</span><span className="text-[#607096]">{Math.round(criterion.score * 100)}%</span></div><div className="mt-2 h-2 rounded-full bg-[#E8EDF7]"><div className="h-2 rounded-full bg-[#5572B8]" style={{ width: `${Math.max(0, Math.min(100, criterion.score * 100))}%` }} /></div>{criterion.evidence && <p className="mt-1 text-xs text-[#7A89A8]">{criterion.evidence}</p>}</div>) : <p className="text-sm text-[#607096]">Chưa có dữ liệu chi tiết.</p>}</div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F5F7FC] p-3"><div className="text-xs text-[#7A89A8]">{label}</div><div className="mt-1 text-sm font-bold capitalize text-[#204195]">{value}</div></div>; }
function Insight({ title, icon, content }: { title: string; icon: ReactNode; content: ReactNode }) { return <article className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs"><div className="flex items-center gap-2"><span>{icon}</span><h2 className="font-bold">{title}</h2></div><div className="mt-4">{content}</div></article>; }

export default function CvScorePage() { return <Suspense fallback={<div className="p-8 text-center">Đang tải…</div>}><ScorePageContent /></Suspense>; }
