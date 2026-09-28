'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Brain,
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  RotateCcw,
  User,
} from 'lucide-react';
import { useLiveKitRoom, type LiveKitRoomStatus } from '../hooks/useLiveKitRoom';

function statusLabel(status: LiveKitRoomStatus, agentConnected: boolean): string {
  switch (status) {
    case 'connecting':
      return 'Đang kết nối LiveKit...';
    case 'agent-speaking':
      return 'AI đang nói';
    case 'user-speaking':
      return 'Bạn đang nói';
    case 'waiting-agent':
      return agentConnected ? 'Đã kết nối — chờ AI' : 'Đang chờ AI tham gia';
    case 'connected':
      return 'Bạn có thể bắt đầu nói';
    case 'ended':
      return 'Đã kết thúc';
    case 'error':
      return 'Kết nối thất bại';
    default:
      return 'Sẵn sàng kết nối';
  }
}

export default function LiveKitInterviewRoom({
  sessionId,
  mode,
}: {
  sessionId: string;
  mode: 'voice' | 'video';
}) {
  const router = useRouter();
  const livekit = useLiveKitRoom({ sessionId, cameraOnStart: mode === 'video' });

  const statusText = useMemo(
    () => statusLabel(livekit.status, livekit.isAgentConnected),
    [livekit.isAgentConnected, livekit.status],
  );

  const endRoom = async () => {
    await livekit.disconnect();
    router.push('/dashboard');
  };

  const statusColor =
    livekit.status === 'agent-speaking'
      ? 'bg-red-500'
      : livekit.status === 'user-speaking'
        ? 'bg-emerald-500'
        : livekit.status === 'error'
          ? 'bg-red-500'
          : 'bg-amber-400';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0D1733] font-body text-white">
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[#101D42] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-headline text-xl font-black tracking-tight">INTERVIA</span>
          <span className="hidden h-6 w-px bg-white/15 sm:block" />
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            LiveKit {mode === 'video' ? 'Voice + Video' : 'Voice'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void endRoom()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#C9362B] px-3 text-sm font-bold text-white transition hover:bg-[#A92C24]"
        >
          <PhoneOff className="size-4" />
          <span className="hidden sm:inline">Kết thúc</span>
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:p-4">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,_#243D86_0%,_#131F46_50%,_#0B1430_100%)] p-5 shadow-2xl">
          {mode === 'video' ? (
            <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
              <ParticipantCard label="AI Interviewer" icon={<Brain className="size-12" />} active={livekit.isAgentSpeaking} />
              <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/25">
                <video ref={livekit.localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                {!livekit.cameraEnabled && <ParticipantCard label="Bạn" icon={<User className="size-12" />} active={livekit.isUserSpeaking} />}
                <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Bạn</span>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-3xl flex-col items-center gap-7 text-center">
              <ParticipantOrb label="AI Interviewer" icon={<Brain className="size-12" />} active={livekit.isAgentSpeaking} color="red" />
              <div className="flex items-center gap-1.5" aria-label="LiveKit voice activity">
                {Array.from({ length: 15 }, (_, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition-all duration-150 ${livekit.isAgentSpeaking ? 'bg-red-400' : livekit.isUserSpeaking ? 'bg-emerald-400' : 'bg-amber-400/60'}`}
                    style={{ height: `${18 + ((index * 17) % 42)}px` }}
                  />
                ))}
              </div>
              <ParticipantOrb label="Bạn" icon={<User className="size-12" />} active={livekit.isUserSpeaking} color="green" />
            </div>
          )}

          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/25 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur">
            <Radio className="size-4 text-amber-300" />
            {statusText}
          </div>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#101D42]/95 p-2 shadow-2xl backdrop-blur-xl">
            <ControlButton
              label={livekit.micEnabled ? 'Tắt microphone' : 'Bật microphone'}
              onClick={() => void livekit.toggleMic()}
              disabled={!livekit.isConnected}
              active={livekit.micEnabled}
              icon={livekit.micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
            />
            {mode === 'video' && (
              <ControlButton
                label={livekit.cameraEnabled ? 'Tắt camera' : 'Bật camera'}
                onClick={() => void livekit.toggleCamera()}
                disabled={!livekit.isConnected}
                active={livekit.cameraEnabled}
                icon={livekit.cameraEnabled ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
              />
            )}
            <ControlButton label="Kết thúc" onClick={() => void endRoom()} active={false} danger icon={<PhoneOff className="size-5" />} />
          </div>
        </section>

        <aside className="flex h-[34vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#F8FAFE] text-[#17244A] lg:h-auto lg:w-[380px]">
          <div className="flex items-center justify-between border-b border-[#DCE3F1] bg-white px-5 py-4">
            <div>
              <h2 className="font-headline text-base font-bold">Live transcript</h2>
              <p className="mt-1 text-[11px] text-[#7A87A5]">{livekit.isAgentConnected ? 'AI đang ở trong phòng' : 'Đang chờ agent tham gia'}</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {livekit.transcript.length === 0 ? (
              <p className="text-sm text-[#7A87A5]">Bản ghi sẽ hiển thị khi cuộc trò chuyện bắt đầu.</p>
            ) : (
              livekit.transcript.map((line) => (
                <div key={line.id} className={line.speaker === 'user' ? 'ml-6' : 'mr-6'}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${line.speaker === 'user' ? 'rounded-tr-sm bg-[#234196] text-white' : 'rounded-tl-sm bg-[#FBE8EC] text-[#6E3047]'}`}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-70">{line.speaker === 'user' ? 'Bạn' : 'AI'}</p>
                    {line.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div ref={livekit.remoteAudioContainerRef} className="hidden" aria-hidden="true" />
          {livekit.error && (
            <div className="m-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{livekit.error}</span>
            </div>
          )}
        </aside>
      </main>

      {!livekit.isConnected && livekit.status !== 'connecting' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
          <button
            type="button"
            onClick={() => void livekit.connect()}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#FCB625] px-6 py-3 text-sm font-bold text-[#14244B] shadow-xl transition hover:bg-[#ffd15b]"
          >
            {livekit.status === 'error' ? <RotateCcw className="size-4" /> : <Mic className="size-4" />}
            {livekit.status === 'error' ? 'Thử kết nối lại' : 'Bắt đầu LiveKit'}
          </button>
        </div>
      )}
      {livekit.status === 'connecting' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#14244B] shadow-xl">
            <Loader2 className="size-4 animate-spin" /> Đang kết nối LiveKit...
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantOrb({
  label,
  icon,
  active,
  color,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  color: 'red' | 'green';
}) {
  const border = color === 'red' ? 'border-red-400 bg-red-400/15' : 'border-emerald-400 bg-emerald-400/15';
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        {active && <span className={`absolute -inset-3 animate-ping rounded-full border ${border} opacity-60`} />}
        <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 ${active ? border : 'border-white/25 bg-white/10'}`}>{icon}</div>
      </div>
      <p className="font-headline text-sm font-bold">{label}</p>
    </div>
  );
}

function ParticipantCard({ label, icon, active }: { label: string; icon: ReactNode; active: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 text-center">
      <div className={`flex h-28 w-28 items-center justify-center rounded-full border-2 ${active ? 'border-red-400 bg-red-400/15' : 'border-white/25 bg-white/10'}`}>{icon}</div>
      <p className="font-headline text-sm font-bold">{label}</p>
      {active && <span className="text-xs text-red-200">Đang nói</span>}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled = false,
  active,
  danger = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active: boolean;
  danger?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'bg-[#C9362B] hover:bg-[#A92C24]' : active ? 'bg-white/15' : 'bg-white/5 text-white/60'}`}
    >
      {icon}
    </button>
  );
}
