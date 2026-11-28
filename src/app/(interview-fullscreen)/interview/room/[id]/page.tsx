'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StructuredTextInterview from '@features/interview/components/StructuredTextInterview';
import InterviewChatRoom from '@features/interview/components/InterviewChatRoom';
import LiveKitInterviewRoom from '@features/interview/components/LiveKitInterviewRoom';
import { interviewRuntimeApi } from '@features/interview/services/interviewRuntime.service';
import { ProcessStatus } from '@components/shared/ProcessSteps';
import { useLanguage } from '@/i18n/LanguageProvider';

type RoomLoadError = 'notReady' | 'loadFailed';

function RoomContent() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const topic = searchParams.get('topic') || '';
  const [mode, setMode] = useState<'text' | 'voice' | 'video' | null>(null);
  const [locale, setLocale] = useState('vi-VN');
  const [experienceType, setExperienceType] = useState<string | null>(null);
  const [sessionContext, setSessionContext] = useState<{ resumeId: string | null; jobId: string | null } | null>(null);
  const [loadError, setLoadError] = useState<RoomLoadError | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    interviewRuntimeApi.get(roomId)
      .then((session) => {
        if (!active) return;
        if (session.status === 'CLOSED') {
          router.replace(`/interview/results/${encodeURIComponent(roomId)}`);
          return;
        }
        if (session.status !== 'OPEN' || session.plan?.status !== 'LOCKED') {
          setLoadError('notReady');
          return;
        }
        setMode(session.mode);
        setLocale(session.locale || 'vi-VN');
        setExperienceType(session.experienceType || 'interview_chat');
        setSessionContext({ resumeId: session.resumeId, jobId: session.jobId });
      })
      .catch(() => {
        if (active) setLoadError('loadFailed');
      });
    return () => {
      active = false;
    };
  }, [roomId, router]);

  const chatBackUrl = useMemo(() => {
    if (sessionContext?.resumeId && sessionContext.jobId) {
      const query = new URLSearchParams({
        candidateId: sessionContext.resumeId,
        jobId: sessionContext.jobId,
        ...(topic ? { jobTitle: topic } : {}),
      });
      return `/interview/cv-score?${query.toString()}`;
    }
    return '/interview/select';
  }, [sessionContext, topic]);

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-center">
        <p className="max-w-md text-sm font-semibold text-[#C43B3B]">{t(`room.page.${loadError}`)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white hover:bg-[#183275]"
          >
            {t('room.common.retry')}
          </button>
          <a
            href="/interview/select"
            className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#EEF2FD]"
          >
            {t('room.page.reselect')}
          </a>
        </div>
      </div>
    );
  }
  if (!mode || !experienceType) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-[#14244B]">
        <p className="text-sm font-semibold">{t('room.page.preparing')}</p>
        <ProcessStatus
          className="w-full max-w-sm"
          phases={[t('uxWs.room.phaseLoad'), t('uxWs.room.phasePlan'), t('uxWs.room.phaseOpen')]}
          activeIndex={0}
        />
      </div>
    );
  }
  if (mode === 'text') {
    if (experienceType === 'question_practice') {
      return <StructuredTextInterview sessionId={roomId} jobTitle={topic} backUrl="/interview/select" />;
    }
    return <InterviewChatRoom sessionId={roomId} jobTitle={topic} backUrl={chatBackUrl} />;
  }
  return <LiveKitInterviewRoom sessionId={roomId} mode={mode} locale={locale} jobTitle={topic} backUrl={chatBackUrl} />;
}

export default function RoomPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-[#14244B]">
          <p className="text-sm font-semibold">{t('room.loading')}</p>
          <ProcessStatus
            className="w-full max-w-sm"
            phases={[t('uxWs.room.phaseLoad'), t('uxWs.room.phasePlan'), t('uxWs.room.phaseOpen')]}
            activeIndex={0}
          />
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
