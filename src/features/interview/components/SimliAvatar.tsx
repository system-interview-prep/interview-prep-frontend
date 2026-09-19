'use client';

import { useEffect, useRef, useState } from 'react';
import { SimliClient } from 'simli-client';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

interface Props {
  // Bật/tắt mic của user (tuỳ chọn)
  isMicMuted?: boolean;
}

export default function SimliAvatar({ isMicMuted }: Props) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [client, setClient] = useState<SimliClient | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let activeClient: SimliClient | null = null;

    async function initSimli() {
      try {
        setIsLoading(true);
        // Gọi lên backend NestJS (ví dụ /ai/avatar-session)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/ai/avatar-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          throw new Error('AVATAR_SESSION_FAILED');
        }
        
        const data = await response.json();
        const sessionToken = data.session_token;

        if (!sessionToken) {
          throw new Error('AVATAR_TOKEN_MISSING');
        }

        if (videoRef.current && audioRef.current) {
          // Bước 1b: Lấy ICE Servers từ Backend API
          const iceResp = await fetch(`${baseUrl}/ai/avatar-ice-servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const iceData = await iceResp.json();
          const iceServers = iceData.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }];

          // Bước 2: Khởi tạo SimliClient 3.x theo syntax:
          // new SimliClient(session_token, videoElement, audioElement, iceServers, logLevel, transport_mode)
          // Vì Token được gen từ `/startAudioToVideoSession` (API cũ), nó chỉ tương thích với transport 'livekit'
          interface SimliClientInstance {
            start: () => Promise<void>;
            stop?: () => void;
            close?: () => void;
            disconnect?: () => void;
            sendAudioData?: (data: Uint8Array) => void;
          }
          type SimliClientConstructor = new (...args: unknown[]) => SimliClientInstance;
          const SimliClientClass = SimliClient as unknown as SimliClientConstructor;
          const slClient = new SimliClientClass(
            sessionToken, 
            videoRef.current, 
            audioRef.current, 
            iceServers,
            undefined, // logLevel
            'livekit'  // transportMode
          );
          
          activeClient = slClient as any;
          setClient(slClient as any);
          setIsLoading(false);
          console.log('Simli Avatar Loaded');
        }
      } catch (err: unknown) {
        console.error('Simli Error:', err);
        setError(t('room.simliError'));
        setIsLoading(false);
      }
    }

    initSimli();

    return () => {
      // Dọn dẹp session khi unmount
      if (activeClient) {
        const c = activeClient as any;
        try {
          if (typeof c.stop === 'function') {
            (c.stop as () => void)();
          } else {
            // Fallback nếu có thay đổi trong các bản update
            if (typeof c.close === 'function') (c.close as () => void)();
            if (typeof c.disconnect === 'function') (c.disconnect as () => void)();
          }
        } catch (e) {
          console.error('Error stopping SimliClient:', e);
        }
      }
    };
    // Simli must initialize once; including `t` would reconnect on locale change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, []);

  // Lắng nghe tín hiệu âm thanh AI từ hook Socket để nhép môi
  useEffect(() => {
    if (!client) return;

    const handleAIAudio = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<string>;
        const base64String = customEvent.detail;
        if (!base64String) return;
        
        // Convert Base64 sang Uint8Array (PCM 16-bit)
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Truyền raw audio cho Simli webRTC gateway
        const c = client as any;
        if (typeof c.sendAudioData === 'function') {
          (c.sendAudioData as (d: Uint8Array) => void)(bytes);
        }
      } catch (error) {
        console.error('Lỗi khi decode/gửi PCM audio cho Simli:', error);
      }
    };

    window.addEventListener('onSimliAudio', handleAIAudio);
    return () => window.removeEventListener('onSimliAudio', handleAIAudio);
  }, [client]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/25 bg-inverse-surface shadow-[0_16px_48px_-20px_rgba(0,61,155,0.2)]">
      {isLoading && (
        <div className="absolute z-10 flex items-center gap-2 rounded-full bg-inverse-surface/80 px-4 py-2 font-body text-sm text-inverse-on-surface backdrop-blur-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('room.loadingAvatar')}
        </div>
      )}
      {error && (
        <div className="absolute z-10 max-w-[90%] rounded-xl bg-error-container/95 px-4 py-3 text-center text-sm text-on-error-container border border-error/20">
          {error}
        </div>
      )}
      
      {/* Video stream của Avatar */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Audio stream của Avatar (ẩn đi, autoPlay) */}
      <audio ref={audioRef} autoPlay />
      
      {/* Label cho giao diện */}
      <div className="absolute bottom-3 left-3 rounded-lg bg-inverse-surface/75 px-2.5 py-1 font-headline text-xs font-semibold text-inverse-on-surface backdrop-blur-sm">
        {t('voice.labelAiInterviewer')}
      </div>
    </div>
  );
}
