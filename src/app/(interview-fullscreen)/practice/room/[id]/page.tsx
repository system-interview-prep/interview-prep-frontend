'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StructuredTextInterview from '@features/interview/components/StructuredTextInterview';
import { interviewRuntimeApi } from '@features/interview/services/interviewRuntime.service';
import { ProcessStatus } from '@components/shared/ProcessSteps';
import { useLanguage } from '@/i18n/LanguageProvider';

type PracticeLoadError = 'practiceInvalid' | 'practiceLoadFailed';

/** Loading view shared by the page and its Suspense fallback. */
function PracticeRoomLoading({ label }: { label: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-[#14244B]">
      <p className="text-sm font-semibold">{label}</p>
      <ProcessStatus
        className="w-full max-w-sm"
        phases={[t('uxWs.room.phaseLoad'), t('uxWs.room.phasePlan'), t('uxWs.room.phaseOpen')]}
        activeIndex={0}
      />
    </div>
  );
}

/** A failed load always offers a way forward: retry, or pick a CV and role again. */
function PracticeRoomError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-center">
      <p role="alert" className="max-w-md text-sm font-semibold text-[#C43B3B]">
        {message}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="h-11 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white hover:bg-[#183275]"
          >
            {t('room.common.retry')}
          </button>
        ) : null}
        <Link
          href="/interview/select"
          className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#EEF2FD]"
        >
          {t('room.page.reselect')}
        </Link>
      </div>
    </div>
  );
}

function PracticeRoomContent() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const topic = searchParams.get('topic') || '';
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<PracticeLoadError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    interviewRuntimeApi.get(roomId).then((session) => {
      if (!active) return;
      if (session.status === 'CLOSED') {
        router.replace(`/interview/results/${encodeURIComponent(roomId)}`);
        return;
      }
      if (
        session.status !== 'OPEN' ||
        session.plan?.status !== 'LOCKED' ||
        session.mode !== 'text' ||
        session.experienceType !== 'question_practice'
      ) {
        setError('practiceInvalid');
        return;
      }
      setReady(true);
    }).catch(() => {
      if (active) setError('practiceLoadFailed');
    });
    return () => { active = false; };
  }, [roomId, router, attempt]);

  const retry = () => {
    setError(null);
    setReady(false);
    setAttempt((value) => value + 1);
  };

  if (!roomId) {
    return <PracticeRoomError message={t('room.page.practiceMissingId')} />;
  }

  if (error) {
    return <PracticeRoomError message={t(`room.page.${error}`)} onRetry={retry} />;
  }

  if (!ready) {
    return <PracticeRoomLoading label={t('room.page.practiceVerifying')} />;
  }

  return (
    <StructuredTextInterview
      sessionId={roomId}
      jobTitle={topic}
      backUrl="/interview/select"
    />
  );
}

export default function PracticeRoomPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<PracticeRoomLoading label={t('room.page.practicePreparing')} />}>
      <PracticeRoomContent />
    </Suspense>
  );
}
