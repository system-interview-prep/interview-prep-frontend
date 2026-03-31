import { useState, useEffect, useRef, useCallback } from 'react';
import { signalingService } from '../services/socket';
import { ICE_SERVERS } from '../constants';

/**
 * useWebRTC – manages the full WebRTC peer connection lifecycle.
 *
 * @param roomId – the interview room to join
 * @returns local/remote streams + control functions
 */
export function useWebRTC(roomId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs so cleanup functions always see the current values (avoid stale closure)
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // 1. Get user media on mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch(err => console.error('getUserMedia error', err));

    return () => {
      // Use ref – never a stale null like a closure over `localStream` state would be
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 2. Create PeerConnection and wire signaling events
  useEffect(() => {
    if (!localStream) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local tracks to the connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // Prepare remote stream container
    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = e => { e.streams[0].getTracks().forEach(t => remote.addTrack(t)); };

    // Send ICE candidates to the signaling server
    pc.onicecandidate = e => {
      if (e.candidate) {
        signalingService.emit('ice-candidate', { roomId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };

    // Join the signaling room
    signalingService.emit('join-room', { roomId });

    // --- Signaling event handlers ---

    // Second peer joined → we are the caller, create and send offer
    signalingService.on('peer-joined', async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingService.emit('offer', { roomId, offer });
    });

    // Received offer → we are the callee, create and send answer
    signalingService.on('offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signalingService.emit('answer', { roomId, answer });
    });

    // Received answer → apply remote description
    signalingService.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Received ICE candidate from peer
    signalingService.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Peer disconnected
    signalingService.on('peer-left', () => {
      setIsConnected(false);
      setRemoteStream(null);
    });

    return () => {
      signalingService.emit('leave-room', { roomId });
      pc.close();
      signalingService.off('peer-joined');
      signalingService.off('offer');
      signalingService.off('answer');
      signalingService.off('ice-candidate');
      signalingService.off('peer-left');
    };
  }, [localStream, roomId]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const hangUp = useCallback(() => {
    pcRef.current?.close();
    // Stop all local tracks → camera/mic indicator LEDs turn off
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    signalingService.emit('leave-room', { roomId });
    setIsConnected(false);
  }, [roomId]);

  return { localStream, remoteStream, isConnected, toggleMic, toggleCamera, hangUp };
}
