'use client';

import { useEffect, useRef, useState } from 'react';
import { SimliClient } from 'simli-client';

interface Props {
  // Bật/tắt mic của user (tuỳ chọn)
  isMicMuted?: boolean;
}

export default function SimliAvatar({ isMicMuted }: Props) {
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
        // Bước 1: Gọi backend API để lấy session token bảo mật
        // Gọi lên backend NestJS (port 3000 hoặc /api/ai/simli-session tuỳ cấu hình proxy)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/ai/simli-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          throw new Error('Không thể tạo Simli Session từ Backend');
        }
        
        const data = await response.json();
        const sessionToken = data.session_token;

        if (!sessionToken) {
          throw new Error('API không trả về session_token hợp lệ');
        }

        if (videoRef.current && audioRef.current) {
          // Bước 1b: Lấy ICE Servers từ Backend API
          const iceResp = await fetch(`${baseUrl}/ai/simli-ice-servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const iceData = await iceResp.json();
          const iceServers = iceData.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }];

          // Bước 2: Khởi tạo SimliClient 3.x theo syntax:
          // new SimliClient(session_token, videoElement, audioElement, iceServers, logLevel, transport_mode)
          // Vì Token được gen từ `/startAudioToVideoSession` (API cũ), nó chỉ tương thích với transport 'livekit'
          const SimliClientClass = SimliClient as any;
          const slClient = new SimliClientClass(
            sessionToken, 
            videoRef.current, 
            audioRef.current, 
            iceServers,
            undefined, // logLevel
            'livekit'  // transportMode
          );
          
          await slClient.start();
          activeClient = slClient;
          setClient(slClient);
          setIsLoading(false);
          console.log('Simli Avatar Loaded');
        }
      } catch (err: any) {
        console.error('Simli Error:', err);
        setError(err.message || 'Lỗi kết nối Simli');
        setIsLoading(false);
      }
    }

    initSimli();

    return () => {
      // Dọn dẹp session khi unmount
      if (activeClient) {
        // SDK 3.x sử dụng hàm stop() để đóng kết nối WebRTC
        try {
          if (typeof (activeClient as any).stop === 'function') {
            (activeClient as any).stop();
          } else {
            // Fallback nếu có thay đổi trong các bản update
            if (typeof (activeClient as any).close === 'function') (activeClient as any).close();
            if (typeof (activeClient as any).disconnect === 'function') (activeClient as any).disconnect();
          }
        } catch (e) {
          console.error('Error stopping SimliClient:', e);
        }
      }
    };
  }, []);

  // Lắng nghe tín hiệu âm thanh AI từ hook Socket để nhép môi
  useEffect(() => {
    if (!client) return;

    const handleAIAudio = (e: any) => {
      try {
        const base64String = e.detail;
        if (!base64String) return;
        
        // Convert Base64 sang Uint8Array (PCM 16-bit)
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Truyền raw audio cho Simli webRTC gateway
        if (typeof (client as any).sendAudioData === 'function') {
          (client as any).sendAudioData(bytes);
        }
      } catch (error) {
        console.error('Lỗi khi decode/gửi PCM audio cho Simli:', error);
      }
    };

    window.addEventListener('onSimliAudio', handleAIAudio);
    return () => window.removeEventListener('onSimliAudio', handleAIAudio);
  }, [client]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
      {isLoading && <div className="absolute text-white">Đang tải Avatar...</div>}
      {error && <div className="absolute text-red-500">{error}</div>}
      
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
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
        AI Interviewer
      </div>
    </div>
  );
}
