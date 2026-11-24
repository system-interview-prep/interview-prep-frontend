"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import {
  interviewRuntimeApi,
  type InterviewRuntimeSession,
} from "@features/interview/services/interviewRuntime.service";
import { sessionHref, type StoredDashboardSession } from "./DashboardSections";
import { buildJobResultsOverview, type JobResultGroup, type PracticeRoom } from "../utils/jobResults";

function asDashboardSession(session: InterviewRuntimeSession): StoredDashboardSession {
  return {
    sessionId: session.sessionId,
    jobId: session.jobId,
    jobTitle: session.jobTitle ?? undefined,
    startedAt: session.startedAt,
    mode: session.mode,
    status: session.status,
    experienceType: session.experienceType,
    endedAt: session.endedAt,
    endReason: session.endReason ?? null,
    overallScore: session.overallScore ?? null,
    answeredTurns: session.answeredTurns,
    totalTurns: session.totalTurns,
    competencyScores: session.competencyScores ?? [],
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa rõ ngày"
    : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function modeName(mode: StoredDashboardSession["mode"]): string {
  if (mode === "text") return "Phòng Chat";
  if (mode === "voice") return "Phòng Voice";
  return "Phòng Video";
}

function roomName(room: PracticeRoom): string {
  if (room === "chat") return "Chat";
  return room === "voice" ? "Voice" : "Video";
}

function statusLabel(job: JobResultGroup): string {
  if (job.status === "in_progress") return "Có buổi đang dở";
  if (job.status === "scored") return "Đã có điểm";
  return "Chưa có điểm";
}

function statusClass(job: JobResultGroup): string {
  if (job.status === "in_progress") return "bg-[#FFF4DD] text-[#8A5300]";
  if (job.status === "scored") return "bg-[#E8F5EC] text-[#247044]";
  return "bg-[#F0F3F8] text-[#52627D]";
}

function StatCard({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-[#DCE6F6] bg-gradient-to-br from-white to-[#F0F6FF] p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-[#14244B]">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none tabular-nums text-[#1768E5]">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-relaxed text-[#52627D]">{detail}</p> : null}
      {children}
    </section>
  );
}

function JobRow({
  job,
  expanded,
  onToggle,
}: {
  job: JobResultGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detailId = `job-result-${job.jobId ?? "general"}`;
  return (
    <article className="overflow-hidden rounded-xl border border-[#E2E9F4] bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-[minmax(150px,1.6fr)_0.7fr_0.9fr_0.9fr_0.9fr_auto] sm:items-center sm:gap-3">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <h3 className="truncate font-semibold text-[#14244B]" title={job.title}>{job.title}</h3>
          {job.jobId === null ? <p className="mt-0.5 text-xs text-[#64748B]">Không gắn với một JD cụ thể</p> : null}
        </div>
        <div>
          <p className="text-[11px] text-[#64748B] sm:hidden">Số buổi</p>
          <p className="font-semibold tabular-nums text-[#14244B]">{job.sessions.length} buổi</p>
        </div>
        <div>
          <p className="text-[11px] text-[#64748B] sm:hidden">Điểm trung bình theo phòng</p>
          {job.scoredSessions.length === 0 ? <p className="font-semibold text-[#64748B]">Chưa có điểm</p> : (
            <div className="space-y-0.5 text-xs font-semibold tabular-nums text-[#14244B]">
              {(["chat", "voice", "video"] as const).map((room) => {
                const score = job.scoresByRoom[room];
                return score.count ? <p key={room}>{roomName(room)}: {score.average?.toFixed(1)}/10 <span className="font-normal text-[#64748B]">({score.count})</span></p> : null;
              })}
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] text-[#64748B] sm:hidden">Điểm gần nhất</p>
          <p className="font-semibold tabular-nums text-[#14244B]">
            {job.latestScoredSession ? `${job.latestScoredSession.overallScore.toFixed(1)}/10` : "—"}
          </p>
          {job.latestScoredSession ? (
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              {formatDate(job.latestScoredSession.startedAt)} · {modeName(job.latestScoredSession.mode)}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] text-[#64748B] sm:hidden">Luyện gần nhất</p>
          <p className="text-sm tabular-nums text-[#52627D]">{formatDate(job.latestSession.startedAt)}</p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(job)}`}>{statusLabel(job)}</span>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={onToggle}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#C9D7F1] bg-white px-3 text-sm font-semibold text-[#204195] hover:bg-[#F0F4FC]"
          >
            {expanded ? "Thu gọn" : "Xem chi tiết"}
            {expanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {expanded ? (
        <div id={detailId} className="border-t border-[#E8EDF5] bg-[#FAFCFF] px-4 py-3">
          <h4 className="text-sm font-semibold text-[#14244B]">Các buổi đã tham gia</h4>
          <ul className="mt-2 divide-y divide-[#E8EDF5]">
            {job.sessions.map((session) => (
              <li key={session.sessionId} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-[#14244B]">
                    {formatDate(session.startedAt)} · {modeName(session.mode)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {session.status === "CLOSED"
                      ? session.overallScore == null ? "Đã kết thúc · chưa có điểm" : "Đã được chấm"
                      : "Buổi đang dở"}
                    {session.endReason === "TECHNICAL_FAILURE" ? " · Kết thúc do sự cố kỹ thuật" : ""}
                    {typeof session.answeredTurns === "number" && typeof session.totalTurns === "number"
                      ? ` · Đã trả lời ${session.answeredTurns}/${session.totalTurns} câu`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold tabular-nums text-[#14244B]">
                    {session.overallScore == null ? "Chưa có điểm" : `${session.overallScore.toFixed(1)}/10`}
                  </span>
                  <Link href={sessionHref(session)} className="font-semibold text-[#204195] underline-offset-4 hover:underline">
                    {session.endReason === "TECHNICAL_FAILURE"
                      ? "Bắt đầu buổi mới"
                      : session.status === "CLOSED" ? "Xem báo cáo" : "Tiếp tục"} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function JobResultsPage() {
  const [sessions, setSessions] = useState<StoredDashboardSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const rows = await interviewRuntimeApi.listAll();
      setSessions(rows.map(asDashboardSession));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const overview = useMemo(() => buildJobResultsOverview(sessions), [sessions]);
  const highest = overview.highestScoredSession;
  const mostPractised = overview.jobs[0] ?? null;
  const highestAverage = overview.jobs.flatMap((job) => (["chat", "voice", "video"] as const).map((room) => ({
    job,
    room,
    ...job.scoresByRoom[room],
  }))).filter((item) => item.count >= 2 && item.average !== null)
    .sort((left, right) => (right.average ?? 0) - (left.average ?? 0))[0] ?? null;

  return (
    <div className="space-y-6 text-[#14244B] sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-[#52627D] hover:text-[#204195]">
            <ArrowLeft className="size-4" aria-hidden="true" /> Trang chủ
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tổng quan công việc đã tham gia</h1>
          <p className="mt-1 text-sm text-[#52627D]">Theo dõi số buổi luyện và điểm số của các vị trí bạn đã thực hành.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#C9D7F1] bg-white px-4 text-sm font-semibold text-[#204195] hover:bg-[#F0F4FC] disabled:opacity-60">
          <RotateCw className="size-4" aria-hidden="true" /> Cập nhật
        </button>
      </header>

      {failed ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#F1D3D3] bg-[#FDF5F5] p-4 text-sm text-[#9B2C2C] sm:flex-row sm:items-center sm:justify-between">
          <p>Không tải được lịch sử luyện tập nên chưa thể tổng hợp chính xác.</p>
          <button type="button" onClick={() => void load()} className="self-start font-semibold underline sm:self-auto">Thử tải lại</button>
        </div>
      ) : null}

      {loading ? (
        <div role="status" aria-label="Đang tải kết quả theo công việc" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-[#EEF2F8] motion-reduce:animate-none" />)}
        </div>
      ) : failed ? null : overview.attendedSessions.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-[#DCE6F6] bg-white px-6 py-10 text-center sm:py-14">
          <div aria-hidden="true" className="relative h-36 w-44">
            <Image src="/img/Clipboard_Search_Icons.png" alt="" fill sizes="176px" className="object-contain" />
          </div>
          <h2 className="mt-2 text-lg font-semibold">Chưa có buổi luyện nào để tổng hợp</h2>
          <p className="mt-1 max-w-md text-sm text-[#52627D]">Tham gia một buổi phỏng vấn; số buổi và kết quả sẽ xuất hiện tại đây.</p>
          <Link href="/interview/select" className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white hover:bg-[#183275]">Bắt đầu luyện</Link>
        </section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Tổng số công việc đã luyện" value={String(overview.jobCount)} detail="Không tính việc đã lưu nhưng chưa tham gia buổi nào." />
            <StatCard label="Tổng số buổi đã tham gia" value={`${overview.attendedSessions.length} buổi`} detail="Tính trên tất cả công việc và phòng luyện." />
            {(["chat", "voice", "video"] as const).map((room) => {
              const score = overview.scoresByRoom[room];
              return <StatCard key={room} label={`Điểm trung bình · ${roomName(room)}`} value={score.average === null ? "Chưa có điểm" : `${score.average.toFixed(1)}/10`} detail={`${score.count} buổi có điểm trong phòng này.`} />;
            })}
            <StatCard
              label="Điểm cao nhất"
              value={highest ? `${highest.overallScore.toFixed(1)}/10` : "Chưa có điểm"}
              detail={highest ? `${highest.jobTitle || "Phỏng vấn chung"} · ${formatDate(highest.startedAt)} · ${modeName(highest.mode)}` : "Điểm sẽ xuất hiện sau khi có buổi được chấm."}
            >
              {highest ? <Link href={sessionHref(highest)} className="mt-2 inline-block text-xs font-semibold text-[#204195] underline-offset-4 hover:underline">Mở báo cáo nguồn →</Link> : null}
            </StatCard>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(260px,0.9fr)]">
            <section aria-labelledby="job-results-list-title" className="min-w-0 rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h2 id="job-results-list-title" className="text-xl font-bold">Danh sách công việc</h2>
                <p className="mt-1 text-sm text-[#52627D]">Điểm gần nhất là điểm của buổi mới nhất đã được chấm; ngày luyện được hiển thị riêng.</p>
              </div>
              <div className="mb-2 hidden grid-cols-[minmax(150px,1.6fr)_0.7fr_0.9fr_0.9fr_0.9fr_auto] gap-3 rounded-lg bg-[#EDF3FF] px-4 py-2 text-xs font-semibold text-[#52627D] sm:grid">
                <span>Công việc</span><span>Số buổi</span><span>Điểm trung bình</span><span>Điểm gần nhất</span><span>Luyện gần nhất</span><span>Trạng thái / chi tiết</span>
              </div>
              <div className="space-y-2">
                {overview.jobs.map((job) => {
                  const key = job.jobId ?? "__general__";
                  return (
                    <JobRow
                      key={key}
                      job={job}
                      expanded={expandedJob === key}
                      onToggle={() => setExpandedJob((current) => current === key ? null : key)}
                    />
                  );
                })}
              </div>
            </section>

            <aside aria-labelledby="quick-insights-title" className="overflow-hidden rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm sm:p-5">
              <div aria-hidden="true" className="relative mb-3 h-32 overflow-hidden rounded-xl bg-[#EDF5FF] sm:h-40">
                <Image src="/img/Clipboard_Search_Icons.png" alt="" fill sizes="(max-width: 1280px) 100vw, 340px" className="object-contain" />
              </div>
              <h2 id="quick-insights-title" className="text-xl font-bold">Nhận xét nhanh</h2>
              <ul className="mt-2 divide-y divide-[#E8EDF5] text-sm">
                {mostPractised ? <li className="py-3">Bạn tham gia nhiều buổi nhất ở <strong>{mostPractised.title}</strong> ({mostPractised.sessions.length} buổi).</li> : null}
                {highestAverage ? <li className="py-3">Điểm trung bình cao nhất trong {roomName(highestAverage.room)}: <strong>{highestAverage.job.title}</strong> ({highestAverage.average?.toFixed(1)}/10 từ {highestAverage.count} buổi được chấm).</li> : (
                  <li className="py-3 text-[#52627D]">Chưa đủ hai buổi có điểm trong cùng một công việc và phòng để so sánh điểm trung bình.</li>
                )}
                {overview.scoredSessionCount < overview.attendedSessions.length ? <li className="py-3">{overview.attendedSessions.length - overview.scoredSessionCount} buổi chưa có điểm; mở chi tiết từng công việc để xem trạng thái.</li> : null}
              </ul>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
