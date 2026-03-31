'use client';

import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
}

export default function VideoPlayer({ stream, label, muted = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex-1 bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Camera off
        </div>
      )}
      <span className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded text-white">
        {label}
      </span>
    </div>
  );
}
