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
import { normalizeVoiceTranscript, reconcileVoiceTranscript } from '../utils/voiceLanguage';
import { voiceTransportHealthMessage } from '../utils/voiceTransportHealth';

type LiveKitTokenResponse = {
  serverUrl: string;
  participantToken: string;
  agentName: string;
  roomName: string;
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

/** Where the agent's answer window is, from the `intervia.turn` topic. */
export type LiveKitTurnState = 'answering' | 'processing' | 'listening';

/** Commands the room sends to the agent on the `intervia.answer` topic. */
export type LiveKitAnswerCommand = 'answer.commit' | 'question.repeat';

const TURN_STATES: readonly LiveKitTurnState[] = ['answering', 'processing', 'listening'];

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
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Trình duyệt đang chặn quyền micro hoặc camera. Hãy cho phép quyền truy cập trong thanh địa chỉ rồi thử lại.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Không tìm thấy micro hoặc camera phù hợp trên thiết bị này.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Micro hoặc camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.';
    }
  }
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
  // A session owns exactly one media room. Reconnects and second tabs must
  // rejoin that room instead of dispatching another interviewer agent.
  return `interview-${safeSessionId}`;
}

function isRemoteParticipant(participant: Participant | undefined, localIdentity: string): boolean {
  return Boolean(participant && participant.identity !== localIdentity);
}

export function useLiveKitRoom({
  sessionId,
  locale,
  cameraOnStart = false,
}: {
  sessionId: string;
  locale: string;
  cameraOnStart?: boolean;
}) {
  const roomRef = useRef<Room | null>(null);
  const localMicTrackSidRef = useRef<string | null>(null);
  const userSpeakingRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const agentConnectedRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [terminalEvent, setTerminalEvent] = useState<LiveKitTerminalEvent | null>(null);
  const [turnState, setTurnState] = useState<LiveKitTurnState | null>(null);

  const clearRemoteAudio = useCallback(() => {
    for (const element of remoteAudioElementsRef.current) {
      element.remove();
    }
    remoteAudioElementsRef.current = [];
  }, []);

  const disconnect = useCallback(async () => {
    intentionalDisconnectRef.current = true;
    clearRemoteAudio();
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    setIsConnected(false);
    setIsAgentConnected(false);
    agentConnectedRef.current = false;
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setMicEnabled(false);
    setCameraEnabled(false);
    setLocalVideoTrack(null);
    setInterimTranscript('');
    setTransportError(null);
    setTurnState(null);
    setStatus('ended');
  }, [clearRemoteAudio]);

  const connect = useCallback(async () => {
    if (!sessionId || roomRef.current || status === 'connecting') return;

    setError(null);
    setTransportError(null);
    setTerminalEvent(null);
    setTurnState(null);
    setStatus('connecting');
    intentionalDisconnectRef.current = false;
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

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      const detached = track.detach();
      for (const element of detached) {
        remoteAudioElementsRef.current = remoteAudioElementsRef.current.filter((item) => item !== element);
        element.remove();
      }
    };

    const handleParticipantConnected = (participant: Participant) => {
      if (isRemoteParticipant(participant, room.localParticipant.identity)) {
        agentConnectedRef.current = true;
        setIsAgentConnected(true);
        setStatus('connected');
      }
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      if (isRemoteParticipant(participant, room.localParticipant.identity)) {
        agentConnectedRef.current = false;
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
      else if (roomRef.current) setStatus(agentConnectedRef.current ? 'connected' : 'waiting-agent');
    };

    const handleDisconnected = () => {
      clearRemoteAudio();
      roomRef.current = null;
      agentConnectedRef.current = false;
      setIsConnected(false);
      setIsAgentConnected(false);
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      setMicEnabled(false);
      setCameraEnabled(false);
      setLocalVideoTrack(null);
      setInterimTranscript('');
      setTurnState(null);
      if (intentionalDisconnectRef.current) {
        setStatus('ended');
        return;
      }
      setStatus('error');
      setError('Kết nối phòng phỏng vấn đã bị gián đoạn. Hãy kiểm tra mạng và kết nối lại.');
    };

    const handleReconnecting = () => {
      setStatus('connecting');
      setTransportError(
        locale.toLowerCase().startsWith('vi')
          ? 'Kết nối giọng nói đang gián đoạn. Hệ thống đang tự kết nối lại; vui lòng tạm dừng nói.'
          : 'The voice connection is interrupted. Reconnecting automatically; please pause speaking.',
      );
    };

    const handleReconnected = () => {
      setTransportError(null);
      setStatus(agentConnectedRef.current ? 'connected' : 'waiting-agent');
    };

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: Participant,
      publication?: { trackSid?: string },
    ) => {
      for (const segment of segments) {
        if (!segment.text) continue;
        const rawSegment = segment as TranscriptionSegment & {
          transcribedTrackId?: string;
          trackId?: string;
        };
        const trackId = rawSegment.transcribedTrackId || rawSegment.trackId || publication?.trackSid || '';
        const id = `${trackId}:${segment.id}`;

        const isUserTrack = Boolean(localMicTrackSidRef.current && trackId === localMicTrackSidRef.current);
        const isLocalParticipant = participant?.identity === room.localParticipant.identity;
        const speaker: LiveKitTranscriptLine['speaker'] =
          isUserTrack || isLocalParticipant || (userSpeakingRef.current && !agentSpeakingRef.current)
            ? 'user'
            : 'ai';

        const text = normalizeVoiceTranscript(segment.text, locale, speaker);
        if (!segment.final) {
          if (speaker === 'user') setInterimTranscript(text);
          continue;
        }
        if (seenTranscriptIdsRef.current.has(id)) continue;
        seenTranscriptIdsRef.current.add(id);
        if (speaker === 'user') setInterimTranscript('');
        const normalizedText = text.toLocaleLowerCase();
        const dedupeKey = `${speaker}:${normalizedText}`;
        const now = Date.now();
        const previousAt = recentTranscriptRef.current.get(dedupeKey);
        if (previousAt && now - previousAt < 3000) continue;
        recentTranscriptRef.current.set(dedupeKey, now);
        for (const [key, timestamp] of recentTranscriptRef.current) {
          if (now - timestamp > 5000) recentTranscriptRef.current.delete(key);
        }

        setTranscript((previous) => {
          return reconcileVoiceTranscript(previous, { id, speaker, text }, locale);
        });
      }
    };

    const handleData = (payload: Uint8Array, _participant?: Participant, _kind?: unknown, topic?: string) => {
      if (topic !== 'intervia.session' && topic !== 'intervia.health' && topic !== 'intervia.turn') return;
      try {
        const event = JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
        if (topic === 'intervia.turn') {
          const state = event.state as LiveKitTurnState;
          if (event.type === 'turn.state' && TURN_STATES.includes(state)) setTurnState(state);
          return;
        }
        if (topic === 'intervia.health') {
          const message = voiceTransportHealthMessage(event, locale);
          if (message !== undefined) setTransportError(message);
          return;
        }
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
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
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
        try {
          const cameraPublication = await room.localParticipant.setCameraEnabled(true);
          const track = cameraPublication?.track;
          if (track && track.kind === Track.Kind.Video) {
            setLocalVideoTrack(track as LocalVideoTrack);
          }
          setCameraEnabled(Boolean(cameraPublication));
        } catch (cameraError) {
          // A denied or unavailable camera must not tear down a working voice
          // interview. Keep the room connected and let the candidate retry.
          setCameraEnabled(false);
          setLocalVideoTrack(null);
          setError(errorMessage(cameraError));
        }
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
      setStatus(agentConnectedRef.current ? 'connected' : 'waiting-agent');
    } catch (connectionError) {
      room.removeAllListeners();
      await room.disconnect();
      roomRef.current = null;
      setIsConnected(false);
      setStatus('error');
      setError(errorMessage(connectionError));
    }
  }, [cameraOnStart, clearRemoteAudio, locale, sessionId, status]);

  /** "Xong" submits the buffered answer now; "Nhắc lại" replays the question. */
  const sendAnswerCommand = useCallback(async (type: LiveKitAnswerCommand) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type })), {
        reliable: true,
        topic: 'intervia.answer',
      });
    } catch {
      setError(
        locale.toLowerCase().startsWith('vi')
          ? 'Chưa gửi được yêu cầu tới người phỏng vấn. Bạn thử lại nhé.'
          : 'Could not reach the interviewer. Please try again.',
      );
    }
  }, [locale]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      setMicEnabled(next);
      setError(null);
    } catch (mediaError) {
      setError(errorMessage(mediaError));
    }
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraEnabled;
    try {
      const publication = await room.localParticipant.setCameraEnabled(next);
      const track = publication?.track;
      setLocalVideoTrack(track && track.kind === Track.Kind.Video ? (track as LocalVideoTrack) : null);
      setCameraEnabled(next);
      setError(null);
    } catch (mediaError) {
      setError(errorMessage(mediaError));
    }
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
    sendAnswerCommand,
    localVideoRef,
    remoteAudioContainerRef,
    transcript,
    interimTranscript,
    status,
    isConnected,
    isAgentConnected,
    isAgentSpeaking,
    isUserSpeaking,
    micEnabled,
    cameraEnabled,
    error: transportError || error,
    terminalEvent,
    turnState,
  };
}
