'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { jobProfileApi, type JobProfile } from '@features/admin/services/jobProfile.service';
import { userCvApi, type UserCvDto } from '@features/resume/services/userCv.service';
import { startInterviewSession } from '@features/interview/services/interviewSession.service';

export function PracticeCvJdSection() {
  const router = useRouter();

  // Data lists
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [cvs, setCvs] = useState<UserCvDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Selections
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  // Preparation state
  const [isStarting, setIsStarting] = useState(false);
  const [prepStep, setPrepStep] = useState<string>('');
  const [startError, setStartError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [jobsRes, cvsRes] = await Promise.all([
        jobProfileApi.list({ limit: 50 }),
        userCvApi.list(50).catch(() => ({ data: { items: [] } })),
      ]);

      const activeJobs = (jobsRes.data.items ?? []).filter(
        (j) => j.status === 'ACTIVE' || !j.status
      );
      setJobs(activeJobs);
      if (activeJobs.length > 0) {
        setSelectedJobId(activeJobs[0].id);
      }

      const availableCvs = (cvsRes.data.items ?? []).filter(
        (c) => c.status === 'DONE' || !c.status
      );
      setCvs(availableCvs);
      if (availableCvs.length > 0) {
        setSelectedCvId(availableCvs[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách công việc và CV.';
      setDataError(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const selectedCv = cvs.find((c) => c.id === selectedCvId) ?? null;

  const handleStartPractice = async () => {
    if (!selectedJobId || !selectedCvId || isStarting) return;

    setIsStarting(true);
    setStartError(null);
    setPrepStep('Đang khởi tạo phiên luyện tập (P0)...');

    try {
      setPrepStep('Đang đối chiếu năng lực và lập kế hoạch câu hỏi theo CV–JD (P1)...');
      const targetUrl = await startInterviewSession({
        mode: 'chat',
        experience: 'question_practice',
        candidateId: selectedCvId,
        jobId: selectedJobId,
        jobTitle: selectedJob?.title || undefined,
        lang: 'vi',
      });

      setPrepStep('Chuẩn bị phòng luyện tập hoàn tất! Đang chuyển hướng...');
      router.push(targetUrl);
    } catch (err: unknown) {
      setIsStarting(false);
      setPrepStep('');
      const msg = err instanceof Error ? err.message : String(err);
      setStartError(msg || 'Không thể bắt đầu phiên luyện tập theo CV–JD.');
    }
  };

  const isQuestionUnavailable = Boolean(
    startError && startError.includes('question_unavailable')
  );

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#DCE4F3] bg-white p-14 text-center shadow-xs">
        <Loader2 className="size-8 animate-spin text-[#204195]" />
        <p className="mt-3 text-sm font-semibold text-[#14244B]">Đang tải dữ liệu vị trí ứng tuyển và hồ sơ CV...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <AlertCircle className="mx-auto size-8 text-red-600" />
        <h3 className="mt-2 text-base font-bold text-red-900">Không thể tải dữ liệu</h3>
        <p className="mt-1 text-sm text-red-700">{dataError}</p>
        <button
          type="button"
          onClick={() => void loadInitialData()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="size-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-3xl border border-[#DCE4F3] bg-linear-to-br from-white via-[#F8FAFC] to-[#EEF3FC] p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#204195]">
            <Sparkles className="size-3.5" />
            Luyện tập câu hỏi theo CV–JD
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl">
            Tự ôn luyện câu hỏi bám sát vị trí ứng tuyển
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#607096] sm:text-base">
            Hệ thống đối chiếu hồ sơ CV với bản mô tả công việc (JD) để tạo bộ câu hỏi tự luận có cấu trúc từ Ngân hàng câu hỏi đã được kiểm duyệt. Bạn trả lời từng câu bằng văn bản và xem lại sau phiên.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {startError && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-5 ${
            isQuestionUnavailable
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
          role="alert"
        >
          <AlertCircle className={`mt-0.5 size-5 shrink-0 ${isQuestionUnavailable ? 'text-amber-600' : 'text-red-600'}`} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold">
              {isQuestionUnavailable ? 'Ngân hàng câu hỏi chưa đủ cho vị trí này' : 'Không thể bắt đầu phiên luyện tập'}
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              {isQuestionUnavailable
                ? 'Hệ thống chưa có đủ câu hỏi đã phê duyệt và hiệu chuẩn cho vị trí bạn đã chọn. Vui lòng chọn một vị trí tuyển dụng khác bên dưới.'
                : startError}
            </p>
          </div>
        </div>
      )}

      {/* Main Form: Pick JD and Pick CV */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Step 1: Pick Job Profile */}
        <div className="flex flex-col rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-[#EAEFF8] pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#204195] text-xs font-bold text-white">
                1
              </span>
              <h3 className="text-base font-bold text-[#14244B]">Chọn vị trí công việc (JD)</h3>
            </div>
            <span className="text-xs font-semibold text-[#607096]">{jobs.length} vị trí khả dụng</span>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#607096]">Chưa có vị trí công việc nào sẵn sàng.</p>
            ) : (
              jobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setStartError(null);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#204195] bg-[#EEF3FC]/60 ring-2 ring-[#204195]/20 shadow-xs'
                        : 'border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#14244B]">{job.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#607096]">
                          {Boolean(job.company) && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="size-3 text-[#7A89A8]" />
                              {typeof job.company === 'string' ? job.company : job.company?.name || ''}
                            </span>
                          )}
                          {job.seniority && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F4FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                              {job.seniority}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isSelected ? 'border-[#204195] bg-[#204195] text-white' : 'border-[#C9D7F1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Pick Candidate CV */}
        <div className="flex flex-col rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-[#EAEFF8] pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#204195] text-xs font-bold text-white">
                2
              </span>
              <h3 className="text-base font-bold text-[#14244B]">Chọn hồ sơ ứng viên (CV)</h3>
            </div>
            <span className="text-xs font-semibold text-[#607096]">{cvs.length} hồ sơ</span>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {cvs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#607096]">
                <p>Bạn chưa có hồ sơ CV nào đã phân tích thành công.</p>
                <p className="mt-1">Vui lòng tải lên CV tại trang CV của tôi.</p>
              </div>
            ) : (
              cvs.map((cv) => {
                const isSelected = cv.id === selectedCvId;
                const displayName = cv.originalName || `CV #${cv.id.slice(0, 8)}`;
                return (
                  <button
                    key={cv.id}
                    type="button"
                    onClick={() => {
                      setSelectedCvId(cv.id);
                      setStartError(null);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#204195] bg-[#EEF3FC]/60 ring-2 ring-[#204195]/20 shadow-xs'
                        : 'border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 shrink-0 text-[#204195]" />
                          <p className="truncate text-sm font-bold text-[#14244B]">{displayName}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-[#607096]">
                          Cập nhật: {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isSelected ? 'border-[#204195] bg-[#204195] text-white' : 'border-[#C9D7F1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Summary & Start CTA */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">Cấu hình phiên luyện tập</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#14244B]">
            <span>{selectedJob?.title || 'Chưa chọn vị trí'}</span>
            <span className="text-[#C9D7F1]">•</span>
            <span className="text-[#204195]">{selectedCv?.originalName || 'Chưa chọn CV'}</span>
          </div>
          {isStarting && (
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#204195] animate-pulse">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{prepStep}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleStartPractice()}
          disabled={!selectedJobId || !selectedCvId || isStarting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#204195] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#183275] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
        >
          {isStarting ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span>Đang thiết lập...</span>
            </>
          ) : (
            <>
              <span>Bắt đầu luyện tập theo CV–JD</span>
              <ArrowRight className="size-4.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
