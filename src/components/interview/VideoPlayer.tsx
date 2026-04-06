'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';

interface Props {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  className?: string;
}

export default function VideoPlayer({ stream, label, muted = false, className = '' }: Props) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-high shadow-[0_16px_48px_-20px_rgba(0,61,155,0.15)] ${className}`.trim()}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container/90 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-60">videocam_off</span>
          <span className="text-sm font-medium">{t('room.cameraOff')}</span>
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-lg bg-inverse-surface/75 px-2.5 py-1 font-headline text-xs font-semibold text-inverse-on-surface backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
