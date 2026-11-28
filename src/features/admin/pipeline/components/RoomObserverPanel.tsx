"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  ParticipantKind,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
  type TextStreamReader,
} from "livekit-client";
import { Bot, Eye, EyeOff, Loader2, Maximize2, Mic, MicOff, Minimize2, User, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { pipelineService } from "../services/pipeline.service";
import { clock } from "../utils/pipelineFormat";
import { Chip } from "./ui";

type Phase = "idle" | "connecting" | "connected" | "ended" | "error";

type Seat = {
  identity: string;
  name: string;
  agent: boolean;
  speaking: boolean;
  micOn: boolean;
  video: RemoteTrack | null;
};

type Caption = { id: string; agent: boolean; text: string; final: boolean; at: string };

const MAX_CAPTIONS = 40;

function errorCode(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
  const detail = response?.data?.detail;
  if (typeof detail === "string" && /^[a-z_]+$/.test(detail)) return detail;
  if (response?.status === 503) return "unavailable";
  if (response?.status === 404) return "not_found";
  return "failed";
}

function isAgent(participant: Participant): boolean {
  return participant.kind === ParticipantKind.AGENT || participant.identity.startsWith("agent");
}

function seatOf(participant: RemoteParticipant): Seat {
  const camera = participant.getTrackPublication(Track.Source.Camera);
  const mic = participant.getTrackPublication(Track.Source.Microphone);
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    agent: isAgent(participant),
    speaking: participant.isSpeaking,
    micOn: Boolean(mic && !mic.isMuted),
    video: camera?.track && !camera.isMuted ? (camera.track as RemoteTrack) : null,
  };
}

function VideoTile({ track }: { track: RemoteTrack }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);
  return <video ref={ref} autoPlay playsInline muted className="h-full w-full object-cover" />;
}

/**
 * Live seat in the interview room: the admin joins hidden and listen-only
 * (backend: admin/room_observer.py), sees the candidate's camera, hears both
 * sides and reads the live captions. The candidate and the AI interviewer do
 * not see the admin; nothing is published. Each seat is logged.
 */
export default function RoomObserverPanel({ sessionId, autoJoin = false }: { sessionId: string; autoJoin?: boolean }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [turnState, setTurnState] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  // Floating mini player: keep watching while scrolling the monitoring tabs below.
  const [floating, setFloating] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const captionsRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  const autoJoined = useRef(false);

  const refreshSeats = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    setSeats(
      [...room.remoteParticipants.values()]
        .map(seatOf)
        .sort((a, b) => Number(a.agent) - Number(b.agent)),
    );
  }, []);

  const leave = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    if (audioRef.current) audioRef.current.innerHTML = "";
    setSeats([]);
  }, []);

  const join = useCallback(async () => {
    if (roomRef.current) return;
    setPhase("connecting");
    setError(null);
    setCaptions([]);
    setTurnState(null);
    try {
      const seat = await pipelineService.observe(sessionId);
      const room = new Room({ adaptiveStream: true, dynacast: false });
      roomRef.current = room;

      room
        .on(RoomEvent.ParticipantConnected, refreshSeats)
        .on(RoomEvent.ParticipantDisconnected, refreshSeats)
        .on(RoomEvent.TrackMuted, refreshSeats)
        .on(RoomEvent.TrackUnmuted, refreshSeats)
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach().forEach((element) => element.remove());
          refreshSeats();
        })
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Audio) {
            const element = track.attach() as HTMLAudioElement;
            element.muted = mutedRef.current;
            audioRef.current?.appendChild(element);
          }
          refreshSeats();
        })
        .on(RoomEvent.ActiveSpeakersChanged, refreshSeats)
        .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
        .on(RoomEvent.DataReceived, (payload: Uint8Array, _participant?: RemoteParticipant, _kind?: unknown, topic?: string) => {
          try {
            const message = JSON.parse(new TextDecoder().decode(payload)) as { type?: string; state?: string };
            if (topic === "intervia.turn" && message.type === "turn.state" && message.state) setTurnState(message.state);
            if (topic === "intervia.session" && message.type === "interview.session.closed") {
              setPhase("ended");
              void leave();
            }
          } catch {
            // Not JSON: not one of ours.
          }
        })
        .on(RoomEvent.Disconnected, () => {
          if (roomRef.current === room) roomRef.current = null;
          setPhase((current) => (current === "connected" ? "ended" : current));
          setSeats([]);
        });

      // Live captions of both sides (LiveKit agents publish them on this topic).
      room.registerTextStreamHandler("lk.transcription", async (reader: TextStreamReader, from: { identity: string }) => {
        const segment = reader.info.attributes?.["lk.segment_id"] ?? reader.info.id;
        const final = reader.info.attributes?.["lk.transcription_final"] === "true";
        const sender = room.remoteParticipants.get(from.identity);
        const agent = sender ? isAgent(sender) : from.identity.startsWith("agent");
        const at = new Date().toISOString();
        let text = "";
        for await (const chunk of reader) {
          text += chunk;
          const current = text;
          setCaptions((previous) => {
            const index = previous.findIndex((item) => item.id === segment);
            const next: Caption = { id: segment, agent, text: current, final, at: index >= 0 ? previous[index].at : at };
            const list = index >= 0 ? previous.map((item, i) => (i === index ? next : item)) : [...previous, next];
            return list.slice(-MAX_CAPTIONS);
          });
        }
      });

      await room.connect(seat.serverUrl, seat.participantToken, { autoSubscribe: true });
      try {
        await room.startAudio();
      } catch {
        // Autoplay refused: the "turn on sound" button below asks for a click.
      }
      setAudioBlocked(!room.canPlaybackAudio);
      setPhase(room.state === ConnectionState.Connected ? "connected" : "error");
      refreshSeats();
    } catch (caught) {
      await leave();
      setError(errorCode(caught));
      setPhase("error");
    }
  }, [sessionId, refreshSeats, leave]);

  useEffect(() => {
    if (autoJoin && !autoJoined.current) {
      autoJoined.current = true;
      void join();
    }
  }, [autoJoin, join]);

  useEffect(
    () => () => {
      void leave();
    },
    [leave],
  );

  // Follow the newest caption, like a chat.
  useEffect(() => {
    const element = captionsRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [captions]);

  const toggleMute = () => {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    audioRef.current?.querySelectorAll("audio").forEach((element) => {
      element.muted = next;
    });
  };

  const live = phase === "connected";
  const candidate = seats.find((seat) => !seat.agent) ?? null;
  const interviewer = seats.find((seat) => seat.agent) ?? null;
  const turnLabel = turnState
    ? t(`observe.turn.${turnState}`) !== `observe.turn.${turnState}`
      ? t(`observe.turn.${turnState}`)
      : turnState
    : null;
  const lastCaption = captions[captions.length - 1] ?? null;

  const iconButton = "inline-flex size-8 items-center justify-center rounded-full border border-[#DCE4F3] bg-white text-[#14244B] transition-colors hover:bg-[#F0F4FC]";

  const controls = (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" onClick={toggleMute} aria-pressed={muted} title={t(muted ? "observe.unmute" : "observe.mute")} className={iconButton}>
        {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
        <span className="sr-only">{t(muted ? "observe.unmute" : "observe.mute")}</span>
      </button>
      <button
        type="button"
        onClick={() => setFloating((value) => !value)}
        title={t(floating ? "observe.dock" : "observe.float")}
        className={iconButton}
      >
        {floating ? <Maximize2 className="size-4" aria-hidden="true" /> : <Minimize2 className="size-4" aria-hidden="true" />}
        <span className="sr-only">{t(floating ? "observe.dock" : "observe.float")}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          void leave();
          setFloating(false);
          setPhase("idle");
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#14244B] px-3 text-xs font-semibold text-white hover:bg-[#204195]"
      >
        <EyeOff className="size-3.5" aria-hidden="true" />
        {t("observe.leave")}
      </button>
    </div>
  );

  /** Candidate camera with the AI interviewer as a small badge in the corner. */
  const stage = (compact: boolean) => (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-[#0F1B38] ${
        candidate?.speaking ? "ring-2 ring-[#2FA36B]" : ""
      }`}
    >
      {candidate?.video ? (
        <VideoTile track={candidate.video} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-white/75">
          <User className={compact ? "size-7" : "size-9"} aria-hidden="true" />
          <span className="text-[11px]">{candidate ? t("observe.cameraOff") : t("observe.noCandidate")}</span>
        </div>
      )}
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
        {candidate?.micOn ? <Mic className="size-3" aria-hidden="true" /> : <MicOff className="size-3" aria-hidden="true" />}
        {t("observe.candidate")}
        {candidate?.speaking ? <span className="font-normal">· {t("observe.speaking")}</span> : null}
      </span>
      <span
        className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
          interviewer?.speaking ? "bg-[#204195]" : "bg-black/55"
        }`}
      >
        <Bot className="size-3" aria-hidden="true" />
        {interviewer ? t("observe.interviewer") : t("observe.noAgent")}
        {interviewer?.speaking ? <span className="font-normal">· {t("observe.speaking")}</span> : null}
      </span>
    </div>
  );

  const captionList = (
    <div ref={captionsRef} className="h-full space-y-1 overflow-y-auto pr-1" aria-live="polite">
      {captions.length ? (
        captions.map((caption) => (
          <p key={caption.id} className={`text-[13px] leading-5 ${caption.final ? "text-[#14244B]" : "text-[#607096]"}`}>
            <span className="mr-1.5 text-[10px] tabular-nums text-[#8A98B8]">{clock(caption.at)}</span>
            <span className={`mr-1 font-bold ${caption.agent ? "text-[#204195]" : "text-[#287A4B]"}`}>
              {t(caption.agent ? "observe.aiShort" : "observe.candidate")}:
            </span>
            {caption.text}
          </p>
        ))
      ) : (
        <p className="text-xs text-[#8A98B8]">{t("observe.noCaptions")}</p>
      )}
    </div>
  );

  return (
    <section className="rounded-2xl border border-[#DCE4F3] bg-white p-3 shadow-xs sm:p-4" aria-label={t("observe.title")}>
      <div ref={audioRef} className="hidden" aria-hidden="true" />

      {!live ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195]">
              <Eye className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#14244B]">{t("observe.title")}</h2>
              <p className="text-xs leading-5 text-[#607096]" title={t("observe.hiddenNote")}>
                {t("observe.hiddenShort")}
              </p>
              {phase === "ended" ? <p className="text-xs font-semibold text-[#14244B]">{t("observe.ended")}</p> : null}
              {phase === "error" && error ? (
                <p className="text-xs font-semibold text-[#C43B3B]" role="alert">
                  {t(`observe.error.${error}`) !== `observe.error.${error}` ? t(`observe.error.${error}`) : t("observe.error.failed")}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void join()}
            disabled={phase === "connecting"}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#204195] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#14244B] disabled:opacity-60 sm:self-center"
          >
            {phase === "connecting" ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
            {t(phase === "connecting" ? "observe.joining" : phase === "idle" ? "observe.join" : "observe.rejoin")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="live">{t("observe.watching")}</Chip>
            {turnLabel ? <Chip tone="brand">{turnLabel}</Chip> : null}
            <span className="hidden min-w-0 flex-1 truncate text-[11px] text-[#607096] md:block">{t("observe.hiddenShort")}</span>
            <span className="ml-auto">{controls}</span>
          </div>

          {audioBlocked && !muted ? (
            <button
              type="button"
              onClick={() => void roomRef.current?.startAudio().then(() => setAudioBlocked(false))}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#F1D9A6] bg-[#FFF8E8] px-2.5 py-1.5 text-xs font-semibold text-[#8A5A00]"
            >
              <Volume2 className="size-3.5" aria-hidden="true" />
              {t("observe.enableAudio")}
            </button>
          ) : null}

          {floating ? (
            <p className="mt-2 text-xs text-[#607096]">{t("observe.floatingNote")}</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              {stage(false)}
              <div className="flex min-h-0 flex-col rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-2.5 lg:aspect-auto">
                <p className="mb-1.5 text-[11px] font-semibold text-[#607096]">{t("observe.captions")}</p>
                <div className="h-40 min-h-0 lg:h-auto lg:flex-1 lg:basis-0">{captionList}</div>
              </div>
            </div>
          )}
        </>
      )}

      {live && floating ? (
        <div className="fixed bottom-4 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[#DCE4F3] bg-white p-2.5 shadow-[0_20px_45px_-20px_rgba(20,36,75,0.55)]">
          <div className="mb-2 flex items-center justify-between gap-2 whitespace-nowrap">
            <Chip tone="live">{t("observe.liveShort")}</Chip>
            {controls}
          </div>
          {stage(true)}
          <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#14244B]">
            {lastCaption ? (
              <>
                <span className={`mr-1 font-bold ${lastCaption.agent ? "text-[#204195]" : "text-[#287A4B]"}`}>
                  {t(lastCaption.agent ? "observe.aiShort" : "observe.candidate")}:
                </span>
                {lastCaption.text}
              </>
            ) : (
              <span className="text-[#8A98B8]">{turnLabel ?? t("observe.noCaptions")}</span>
            )}
          </p>
        </div>
      ) : null}
    </section>
  );
}
