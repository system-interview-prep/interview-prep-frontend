import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useMedia – manages local camera + microphone media stream.
 * Handles permission requests and track enable/disable.
 */
export function useMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(s => setStream(s))
      .catch(err => setError(err.message));

    return () => { stream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = useCallback(() => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicEnabled(v => !v);
  }, [stream]);

  const toggleCamera = useCallback(() => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCameraEnabled(v => !v);
  }, [stream]);

  return { stream, micEnabled, cameraEnabled, toggleMic, toggleCamera, error };
}
