'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import StructuredTextInterview from '@features/interview/components/StructuredTextInterview';
import { interviewRuntimeApi } from '@features/interview/services/interviewRuntime.service';

function PracticeRoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const topic = searchParams.get('topic') || '';
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('Phiên luyện tập không ở trạng thái hợp lệ.');
        return;
      }
      setReady(true);
    }).catch(() => {
      if (active) setError('Không thể tải phiên luyện tập hoặc bạn không có quyền truy cập.');
    });
    return () => { active = false; };
  }, [roomId, router]);

  if (!roomId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F9FD] text-[#14244B]">
        <p className="text-sm font-semibold text-red-600">Không tìm thấy mã phiên luyện tập.</p>
      </div>
    );
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-[#F7F9FD] p-6 text-sm font-semibold text-red-600">{error}</div>;
  }

  if (!ready) {
    return <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F7F9FD] text-[#14244B]"><Loader2 className="size-8 animate-spin text-[#204195]" /><p className="text-sm font-semibold">Đang xác minh phiên luyện tập...</p></div>;
  }

  return (
    <StructuredTextInterview
      sessionId={roomId}
      jobTitle={topic}
      backUrl="/practice?tab=cv-jd"
    />
  );
}

export default function PracticeRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F7F9FD] text-[#14244B]">
          <Loader2 className="size-8 animate-spin text-[#204195]" />
          <p className="text-sm font-semibold">Đang chuẩn bị phòng luyện tập...</p>
        </div>
      }
    >
      <PracticeRoomContent />
    </Suspense>
  );
}
