'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import StructuredTextInterview from '@features/interview/components/StructuredTextInterview';
import InterviewChatRoom from '@features/interview/components/InterviewChatRoom';
import LiveKitInterviewRoom from '@features/interview/components/LiveKitInterviewRoom';
import { interviewRuntimeApi } from '@features/interview/services/interviewRuntime.service';
import { useLanguage } from '@/i18n/LanguageProvider';

function RoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const topic = searchParams.get('topic') || '';
  const [mode, setMode] = useState<'text' | 'voice' | 'video' | null>(null);
  const [experienceType, setExperienceType] = useState<string | null>(null);
  const [sessionContext, setSessionContext] = useState<{ resumeId: string | null; jobId: string | null } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
          setLoadError('Phiên phỏng vấn chưa sẵn sàng. Vui lòng tạo lại phiên từ màn hình chọn CV và vị trí.');
          return;
        }
        setMode(session.mode);
        setExperienceType(session.experienceType || 'interview_chat');
        setSessionContext({ resumeId: session.resumeId, jobId: session.jobId });
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải phiên phỏng vấn hoặc bạn không có quyền truy cập.');
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
    return <div className="flex h-screen items-center justify-center bg-[#F7F9FD] p-6 text-sm font-semibold text-red-600">{loadError}</div>;
  }
  if (!mode || !experienceType) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F7F9FD] text-[#14244B]">
        <Loader2 className="size-8 animate-spin text-[#204195]" />
        <p className="text-sm font-semibold">Đang chuẩn bị phòng phỏng vấn...</p>
      </div>
    );
  }
  if (mode === 'text') {
    if (experienceType === 'question_practice') {
      return <StructuredTextInterview sessionId={roomId} jobTitle={topic} backUrl="/practice?tab=cv-jd" />;
    }
    return <InterviewChatRoom sessionId={roomId} jobTitle={topic} backUrl={chatBackUrl} />;
  }
  return <LiveKitInterviewRoom sessionId={roomId} mode={mode} />;
}

export default function RoomPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="flex h-screen flex-col items-center justify-center gap-3 bg-surface text-on-surface"><Loader2 className="size-10 animate-spin text-primary" /><p className="font-headline text-sm font-semibold">{t('room.loading')}</p></div>}>
      <RoomContent />
    </Suspense>
  );
}
