'use client';

import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  BarChart3,
  Users,
  GraduationCap,
  AlertTriangle,
  Quote,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { EvaluationReport, TurnEvaluation } from '../services/interviewReport.service';

export interface InterviewReportViewProps {
  report: EvaluationReport;
  onBack?: () => void;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({ report, onBack }) => {
  const [activeTab, setActiveTab] = useState<'recruiter' | 'candidate'>('recruiter');

  // Normalize camelCase vs snake_case
  const overallScore = report.overall_score ?? report.overallScore ?? 0;
  const decision = report.decision_recommendation ?? report.decisionRecommendation ?? 'CONSIDER';
  const evaluatedAt = report.evaluated_at ?? report.evaluatedAt;
  const recruiterSummary = report.recruiter_summary ?? report.recruiterSummary ?? '';
  const candidateFeedback = report.candidate_feedback ?? report.candidateFeedback ?? '';
  const nextRoundTopics = report.next_round_topics ?? report.nextRoundTopics ?? [];
  const redFlags = report.red_flags ?? report.redFlags ?? [];
  const rawCompetencies = report.competency_scores ?? report.competencyScores ?? [];
  const rawTurns = report.turn_evaluations ?? report.turnEvaluations ?? [];

  const competencyScores = rawCompetencies.map((c) => ({
    competency: c.competency,
    score: typeof c.score === 'number' ? c.score : parseFloat(String(c.score || 0)),
    summary: c.summary,
  }));

  const getBadgeStyle = (rec: string) => {
    switch (rec) {
      case 'STRONG_PASS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30';
      case 'PASS':
        return 'bg-green-50 text-green-800 border-green-300 ring-1 ring-green-400/30';
      case 'CONSIDER':
        return 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/30';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/30';
    }
  };

  const getBadgeLabel = (rec: string) => {
    switch (rec) {
      case 'STRONG_PASS':
        return 'Xuất sắc (Strong Pass)';
      case 'PASS':
        return 'Đạt yêu cầu (Pass)';
      case 'CONSIDER':
        return 'Cần cân nhắc (Consider)';
      default:
        return 'Chưa đạt (Reject)';
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8 font-sans">
      {/* 1. Header & Overall Score */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowRight className="size-3.5 rotate-180" /> Quay lại
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 border border-indigo-100">
              <Sparkles className="size-3.5" /> Báo cáo đánh giá năng lực AI
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Kết Quả Phỏng Vấn Chuyên Môn
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
            <Clock className="size-3.5 text-slate-400" />
            Hoàn tất lúc: {evaluatedAt ? new Date(evaluatedAt).toLocaleString('vi-VN') : 'Vừa xong'}
          </p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-center">
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#204195]">
              {overallScore.toFixed(1)} <span className="text-base font-normal text-slate-400">/ 10</span>
            </div>
            <div className={`mt-1.5 inline-block rounded-full border px-3 py-1 text-xs font-bold ${getBadgeStyle(decision)}`}>
              {getBadgeLabel(decision)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Radar Chart & Competencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex w-full items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <BarChart3 className="size-4 text-indigo-600" /> Đa Giác Năng Lực (Radar Chart)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Thang điểm 10</span>
          </div>
          <div className="w-full h-72">
            {competencyScores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competencyScores}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="competency"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#94a3b8" />
                  <Radar
                    name="Điểm số"
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Đang tổng hợp dữ liệu nhóm năng lực...
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-3.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <TrendingUp className="size-4 text-indigo-600" /> Chi tiết nhóm kỹ năng
          </h3>
          <div className="space-y-3">
            {competencyScores.map((c, i) => (
              <div key={i} className="flex flex-col border-b border-slate-100 pb-2.5 last:border-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{c.competency}</span>
                  <span className="font-bold text-[#204195]">{c.score.toFixed(1)} / 10</span>
                </div>
                {/* Progress bar visual */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (c.score / 10) * 100))}%` }}
                  />
                </div>
                {c.summary && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Dual-View Tabs: Recruiter vs Candidate */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
              activeTab === 'recruiter'
                ? 'border-[#204195] text-[#204195] bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="size-4" /> Góc nhìn Nhà tuyển dụng (Recruiter View)
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
              activeTab === 'candidate'
                ? 'border-[#204195] text-[#204195] bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="size-4" /> Phản hồi cho Ứng viên (Candidate Coaching)
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'recruiter' ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tóm tắt chuyên môn
                </h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {recruiterSummary || 'Chưa có tóm tắt tuyển dụng.'}
                </p>
              </div>

              {nextRoundTopics.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-900">
                    <ArrowRight className="size-3.5" /> Chủ đề đề xuất đào sâu ở vòng tiếp theo:
                  </h5>
                  <ul className="mt-2 space-y-1.5 pl-5 text-sm text-blue-900 list-disc">
                    {nextRoundTopics.map((top, idx) => (
                      <li key={idx} className="leading-snug">{top}</li>
                    ))}
                  </ul>
                </div>
              )}

              {redFlags.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-900">
                    <AlertTriangle className="size-3.5 text-rose-600" /> Cảnh báo rủi ro / nghi vấn (Red Flags):
                  </h5>
                  <ul className="mt-2 space-y-1.5 pl-5 text-sm text-rose-900 list-disc">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="leading-snug">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Góp ý cải thiện kỹ năng
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {candidateFeedback || 'Chưa có nhận xét chi tiết.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Turn-by-Turn STAR & Evidence Quotes Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="size-5 text-[#204195]" /> Chi tiết từng câu hỏi & Bằng chứng đối chiếu
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: {rawTurns.length} câu hỏi
          </span>
        </div>

        {rawTurns.map((t: TurnEvaluation, idx: number) => {
          const turnIndex = t.turn_index ?? t.turnIndex ?? (idx + 1);
          const comp = t.competency || 'Chuyên môn';
          const stage = t.stage || 'DEEP_DIVE';
          const score = typeof t.score === 'number' ? t.score : parseFloat(String(t.score || 0));
          const star = t.star_analysis ?? t.starAnalysis ?? {};
          const evidence = t.evidence_quotes ?? t.evidenceQuotes ?? [];
          const questionText = t.question_text ?? t.questionText;

          return (
            <div
              key={t.id || t.turn_id || t.turnId || idx}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                    Câu {turnIndex}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {comp}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    ({stage})
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#204195]">
                  {score.toFixed(1)} / 10 điểm
                </span>
              </div>

              {questionText && (
                <p className="text-xs font-medium text-slate-700 italic bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  &ldquo;{questionText}&rdquo;
                </p>
              )}

              {/* STAR Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <strong className="text-slate-800">S (Bối cảnh):</strong>{' '}
                  <span className="text-slate-600">{star.situation || 'Chưa rõ ràng'}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <strong className="text-slate-800">T (Nhiệm vụ):</strong>{' '}
                  <span className="text-slate-600">{star.task || 'Chưa rõ ràng'}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <strong className="text-slate-800">A (Hành động):</strong>{' '}
                  <span className="text-slate-600">{star.action || 'Chưa rõ ràng'}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <strong className="text-slate-800">R (Kết quả):</strong>{' '}
                  <span className="text-slate-600">{star.result || 'Chưa rõ ràng'}</span>
                </div>
              </div>

              {/* Evidence Quotes */}
              {evidence.length > 0 && (
                <div className="rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-1 font-bold">
                    <Quote className="size-3.5 text-amber-700" /> Trích dẫn nguyên văn câu trả lời (Evidence Quotes):
                  </div>
                  <ul className="mt-1.5 space-y-1 pl-4 list-disc italic text-amber-950">
                    {evidence.map((q, qIdx) => (
                      <li key={qIdx}>&ldquo;{q}&rdquo;</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {t.feedback && (
                <div className="text-xs text-slate-600 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                  <p>
                    <strong className="text-slate-800">Nhận xét:</strong> {t.feedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewReportView;
