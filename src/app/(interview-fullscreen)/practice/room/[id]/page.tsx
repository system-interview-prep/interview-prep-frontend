'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import StructuredTextInterview from '@features/interview/components/StructuredTextInterview';

function PracticeRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const topic = searchParams.get('topic') || '';

  if (!roomId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F9FD] text-[#14244B]">
        <p className="text-sm font-semibold text-red-600">Không tìm thấy mã phiên luyện tập.</p>
      </div>
    );
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
