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
import {
  describeStartInterviewError,
  isQuestionUnavailableError,
  startInterviewSession,
} from '@features/interview/services/interviewSession.service';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt, localeOf } from '@/i18n/format';

export function PracticeCvJdSection() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  // Data lists
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [cvs, setCvs] = useState<UserCvDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  // `message` is the raw error text when there is one; otherwise a translated fallback is shown.
  const [dataError, setDataError] = useState<{ message: string | null } | null>(null);

  // Selections
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  // Preparation state
  const [isStarting, setIsStarting] = useState(false);
  const [prepStep, setPrepStep] = useState<string>('');
  // The raw failure is kept so the message follows the UI language.
  const [startError, setStartError] = useState<{ cause: unknown } | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [jobsRes, cvsRes] = await Promise.all([
        jobProfileApi.list({ limit: 50 }),
        userCvApi.listAll().catch(() => ({ data: { items: [], total: 0 } })),
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
      setDataError({ message: err instanceof Error ? err.message : null });
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
    setPrepStep('picker.practice.prep.init');

    try {
      setPrepStep('picker.practice.prep.plan');
      const targetUrl = await startInterviewSession({
        mode: 'chat',
        experience: 'question_practice',
        candidateId: selectedCvId,
        jobId: selectedJobId,
        jobTitle: selectedJob?.title || undefined,
        lang: lang === 'en' ? 'en' : 'vi',
      });

      setPrepStep('picker.practice.prep.done');
      router.push(targetUrl);
    } catch (err: unknown) {
      setIsStarting(false);
      setPrepStep('');
      setStartError({ cause: err });
    }
  };

  const isQuestionUnavailable = Boolean(startError && isQuestionUnavailableError(startError.cause));
  const startErrorText = startError ? describeStartInterviewError(startError.cause, t) : null;

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#DCE4F3] bg-white p-14 text-center shadow-xs">
        <Loader2 className="size-8 animate-spin text-[#204195]" />
        <p className="mt-3 text-sm font-semibold text-[#14244B]">{t('picker.practice.loading')}</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <AlertCircle className="mx-auto size-8 text-red-600" />
        <h3 className="mt-2 text-base font-bold text-red-900">{t('picker.practice.loadErrorTitle')}</h3>
        <p className="mt-1 text-sm text-red-700">{dataError.message ?? t('picker.practice.loadErrorFallback')}</p>
        <button
          type="button"
          onClick={() => void loadInitialData()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="size-3.5" />
          <span>{t('picker.practice.retry')}</span>
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
            {t('picker.practice.badge')}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl">
            {t('picker.practice.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#607096] sm:text-base">
            {t('picker.practice.intro')}
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
              {isQuestionUnavailable ? t('picker.practice.qbTitle') : t('picker.practice.startFailedTitle')}
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              {isQuestionUnavailable
                ? t('picker.practice.qbBody')
                : startErrorText}
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
              <h3 className="text-base font-bold text-[#14244B]">{t('picker.practice.step1Title')}</h3>
            </div>
            <span className="text-xs font-semibold text-[#607096]">{fmt(t('picker.practice.jobsAvailable'), { n: jobs.length })}</span>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#607096]">{t('picker.practice.noJobs')}</p>
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
              <h3 className="text-base font-bold text-[#14244B]">{t('picker.practice.step2Title')}</h3>
            </div>
            <span className="text-xs font-semibold text-[#607096]">{fmt(t('picker.practice.cvCount'), { n: cvs.length })}</span>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {cvs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#607096]">
                <p>{t('picker.practice.noCvs')}</p>
                <p className="mt-1">{t('picker.practice.uploadHint')}</p>
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
                          {fmt(t('picker.practice.updated'), {
                            date: new Date(cv.createdAt).toLocaleDateString(localeOf(lang)),
                          })}
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
          <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t('picker.practice.configTitle')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#14244B]">
            <span>{selectedJob?.title || t('picker.practice.noJobSelected')}</span>
            <span className="text-[#C9D7F1]">•</span>
            <span className="text-[#204195]">{selectedCv?.originalName || t('picker.practice.noCvSelected')}</span>
          </div>
          {isStarting && (
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#204195] animate-pulse">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{prepStep ? t(prepStep) : ''}</span>
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
              <span>{t('picker.practice.settingUp')}</span>
            </>
          ) : (
            <>
              <span>{t('picker.practice.start')}</span>
              <ArrowRight className="size-4.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
