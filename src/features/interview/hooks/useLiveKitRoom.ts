'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
  type Participant,
  type RemoteTrack,
  type TranscriptionSegment,
} from 'livekit-client';
import { apiClient } from '@/lib/apiClient';

type LiveKitTokenResponse = {
  serverUrl: string;
  participantToken: string;
  agentName: string;
  expiresInSeconds: number;
};

export type LiveKitTranscriptLine = {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
};

export type LiveKitRoomStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'waiting-agent'
  | 'user-speaking'
  | 'agent-speaking'
  | 'ended'
  | 'error';

export type LiveKitTerminalEvent = {
  sessionStatus: 'CLOSED';
  endReason: string;
};

// Core answers these when the voice stack is not configured on the server.
const VOICE_CONFIG_ERRORS: Record<string, string> = {
  'Voice lab disabled': 'Phỏng vấn giọng nói/video chưa được bật trên máy chủ (VOICE_LAB_ENABLED=false). Hãy dùng chế độ chat hoặc liên hệ quản trị viên.',
  'LiveKit is not configured': 'Máy chủ chưa cấu hình LiveKit (LIVEKIT_URL / API key). Hãy dùng chế độ chat hoặc liên hệ quản trị viên.',
  'LiveKit dependencies are not installed': 'Máy chủ thiếu thư viện LiveKit. Hãy dùng chế độ chat hoặc liên hệ quản trị viên.',
  'OpenAI API key is not configured': 'Máy chủ chưa cấu hình OpenAI API key cho phỏng vấn giọng nói.',
};

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (typeof response?.data?.detail === 'string') {
      return VOICE_CONFIG_ERRORS[response.data.detail] ?? response.data.detail;
    }
    if (error instanceof Error && error.message) return error.message;
  }
  return 'Không thể kết nối LiveKit. Hãy kiểm tra LiveKit Agent và quyền microphone.';
}

function makeRoomName(sessionId: string): string {
  const safeSessionId = sessionId.replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 48) || 'session';
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `interview-${safeSessionId}-${suffix}`;
}

function isRemoteParticipant(participant: Participant | undefined, localIdentity: string): boolean {
  return Boolean(participant && participant.identity !== localIdentity);
}

export function useLiveKitRoom({
  sessionId,
  cameraOnStart = false,
}: {
  sessionId: string;
  cameraOnStart?: boolean;
}) {
  const roomRef = useRef<Room | null>(null);
  const localMicTrackSidRef = useRef<string | null>(null);
  const userSpeakingRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const seenTranscriptIdsRef = useRef(new Set<string>());
  const recentTranscriptRef = useRef(new Map<string, number>());
  const remoteAudioElementsRef = useRef<HTMLElement[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioContainerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<LiveKitRoomStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [transcript, setTranscript] = useState<LiveKitTranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [terminalEvent, setTerminalEvent] = useState<LiveKitTerminalEvent | null>(null);

  const clearRemoteAudio = useCallback(() => {
    for (const element of remoteAudioElementsRef.current) {
      element.remove();
    }
    remoteAudioElementsRef.current = [];
  }, []);

  const disconnect = useCallback(async () => {
    clearRemoteAudio();
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    setIsConnected(false);
    setIsAgentConnected(false);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setMicEnabled(false);
    setCameraEnabled(false);
    setLocalVideoTrack(null);
    setStatus('ended');
  }, [clearRemoteAudio]);

  const connect = useCallback(async () => {
    if (!sessionId || roomRef.current || status === 'connecting') return;

    setError(null);
    setTerminalEvent(null);
    setStatus('connecting');
    seenTranscriptIdsRef.current.clear();
    recentTranscriptRef.current.clear();
    userSpeakingRef.current = false;
    agentSpeakingRef.current = false;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const handleAgentTrack = (track: RemoteTrack, _publication: unknown, participant: Participant) => {
      if (!isRemoteParticipant(participant, room.localParticipant.identity)) return;
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach();
        element.autoplay = true;
        element.setAttribute('data-livekit-agent-audio', 'true');
        remoteAudioContainerRef.current?.appendChild(element);
        remoteAudioElementsRef.current.push(element);
      }
    };

    const handleParticipantConnected = (participant: Participant) => {
      if (isRemoteParticipant(participant, room.localParticipant.identity)) {
        setIsAgentConnected(true);
        setStatus('connected');
      }
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      if (isRemoteParticipant(participant, room.localParticipant.identity)) {
        setIsAgentConnected(false);
        setStatus('waiting-agent');
      }
    };

    const handleActiveSpeakers = (speakers: Participant[]) => {
      const localIdentity = room.localParticipant.identity;
      const userSpeaking = speakers.some((participant) => participant.identity === localIdentity);
      const agentSpeaking = speakers.some((participant) => participant.identity !== localIdentity);
      userSpeakingRef.current = userSpeaking;
      agentSpeakingRef.current = agentSpeaking;
      setIsUserSpeaking(userSpeaking);
      setIsAgentSpeaking(agentSpeaking);
      if (agentSpeaking) setStatus('agent-speaking');
      else if (userSpeaking) setStatus('user-speaking');
      else if (roomRef.current) setStatus(isAgentConnected ? 'connected' : 'waiting-agent');
    };

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: Participant,
      publication?: { trackSid?: string },
    ) => {
      for (const segment of segments) {
        if (!segment.text || !segment.final) continue;
        const rawSegment = segment as TranscriptionSegment & {
          transcribedTrackId?: string;
          trackId?: string;
        };
        const trackId = rawSegment.transcribedTrackId || rawSegment.trackId || publication?.trackSid || '';
        const id = `${trackId}:${segment.id}`;
        if (seenTranscriptIdsRef.current.has(id)) continue;
        seenTranscriptIdsRef.current.add(id);

        const isUserTrack = Boolean(localMicTrackSidRef.current && trackId === localMicTrackSidRef.current);
        const isLocalParticipant = participant?.identity === room.localParticipant.identity;
        const speaker: LiveKitTranscriptLine['speaker'] =
          isUserTrack || isLocalParticipant || (userSpeakingRef.current && !agentSpeakingRef.current)
            ? 'user'
            : 'ai';

        const normalizedText = segment.text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
        const dedupeKey = `${speaker}:${normalizedText}`;
        const now = Date.now();
        const previousAt = recentTranscriptRef.current.get(dedupeKey);
        if (previousAt && now - previousAt < 3000) continue;
        recentTranscriptRef.current.set(dedupeKey, now);
        for (const [key, timestamp] of recentTranscriptRef.current) {
          if (now - timestamp > 5000) recentTranscriptRef.current.delete(key);
        }

        const text = segment.text.trim().replace(/\s+/g, ' ');
        setTranscript((previous) => {
          const last = previous[previous.length - 1];
          // AssemblyAI can emit several final clauses before the user has
          // actually yielded the turn. Keep those clauses in one bubble.
          if (last && last.speaker === speaker) {
            return [
              ...previous.slice(0, -1),
              { ...last, id, text: `${last.text} ${text}`.trim() },
            ].slice(-100);
          }
          return [...previous, { id, speaker, text }].slice(-100);
        });
      }
    };

    const handleData = (payload: Uint8Array, _participant?: Participant, _kind?: unknown, topic?: string) => {
      if (topic !== 'intervia.session') return;
      try {
        const event = JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
        if (event.type !== 'interview.session.closed' || event.sessionStatus !== 'CLOSED') return;
        setTerminalEvent({
          sessionStatus: 'CLOSED',
          endReason: typeof event.endReason === 'string' ? event.endReason : 'COMPLETED',
        });
        setStatus('ended');
      } catch {
        // Ignore packets that do not implement the interview terminal contract.
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleAgentTrack);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.DataReceived, handleData);

    try {
      const roomName = makeRoomName(sessionId);
      const tokenResponse = await apiClient.post<LiveKitTokenResponse>('/ai/voice-lab/livekit-token', {
        sessionId,
        roomName,
      });
      await room.connect(tokenResponse.data.serverUrl, tokenResponse.data.participantToken);
      // connect() is triggered by a user click, so this is the right moment
      // to unlock remote audio in browsers with autoplay restrictions.
      try {
        await room.startAudio();
      } catch {
        // The first subscribed audio track can still prompt the browser.
      }

      const micPublication = await room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      localMicTrackSidRef.current = micPublication?.trackSid || null;
      setMicEnabled(true);

      if (cameraOnStart) {
        const cameraPublication = await room.localParticipant.setCameraEnabled(true);
        const track = cameraPublication?.track;
        if (track && track.kind === Track.Kind.Video) {
          setLocalVideoTrack(track as LocalVideoTrack);
        }
        setCameraEnabled(Boolean(cameraPublication));
      }

      for (const participant of room.remoteParticipants.values()) {
        handleParticipantConnected(participant);
        for (const publication of participant.trackPublications.values()) {
          if (publication.track) {
            handleAgentTrack(publication.track, publication, participant);
          }
        }
      }

      setIsConnected(true);
      setStatus(isAgentConnected ? 'connected' : 'waiting-agent');
    } catch (connectionError) {
      room.removeAllListeners();
      await room.disconnect();
      roomRef.current = null;
      setIsConnected(false);
      setStatus('error');
      setError(errorMessage(connectionError));
    }
  }, [cameraOnStart, isAgentConnected, sessionId, status]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next, {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
    setMicEnabled(next);
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraEnabled;
    const publication = await room.localParticipant.setCameraEnabled(next);
    const track = publication?.track;
    setLocalVideoTrack(track && track.kind === Track.Kind.Video ? (track as LocalVideoTrack) : null);
    setCameraEnabled(next);
  }, [cameraEnabled]);

  useEffect(() => {
    const track = localVideoTrack;
    const element = localVideoRef.current;
    if (!track || !element) return;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [localVideoTrack]);

  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    localVideoRef,
    remoteAudioContainerRef,
    transcript,
    status,
    isConnected,
    isAgentConnected,
    isAgentSpeaking,
    isUserSpeaking,
    micEnabled,
    cameraEnabled,
    error,
    terminalEvent,
  };
}
