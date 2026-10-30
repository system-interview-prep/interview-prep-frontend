"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Play, Radio, Volume2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { API_BASE_URL } from "@/constants";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { resolveBackendErrorMessage } from "@/utils/backendError";
import { pipelineService, type SpeechTestConfig } from "../services/pipeline.service";
import { fill } from "../utils/pipelineFormat";

const DEFAULT_TEXT = "Xin chào, đây là bài kiểm tra giọng nói của hệ thống phỏng vấn.";
const STT_SAMPLE_RATE = 16_000;

async function toMonoWav16k(file: File): Promise<File> {
  const context = new AudioContext();
  try {
    const source = await context.decodeAudioData(await file.arrayBuffer());
    const sampleCount = Math.max(1, Math.floor(source.duration * STT_SAMPLE_RATE));
    const mono = new Float32Array(sampleCount);
    const channels = Array.from({ length: source.numberOfChannels }, (_, index) => source.getChannelData(index));
    for (let targetIndex = 0; targetIndex < sampleCount; targetIndex += 1) {
      const sourcePosition = targetIndex * source.sampleRate / STT_SAMPLE_RATE;
      const leftIndex = Math.floor(sourcePosition);
      const rightIndex = Math.min(leftIndex + 1, source.length - 1);
      const fraction = sourcePosition - leftIndex;
      let mixed = 0;
      for (const channel of channels) {
        mixed += channel[leftIndex] * (1 - fraction) + channel[rightIndex] * fraction;
      }
      mono[targetIndex] = mixed / channels.length;
    }

    const wav = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(wav);
    const writeText = (offset: number, value: string) => {
      for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, STT_SAMPLE_RATE, true);
    view.setUint32(28, STT_SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, sampleCount * 2, true);
    for (let index = 0; index < sampleCount; index += 1) {
      const sample = Math.max(-1, Math.min(1, mono[index]));
      view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new File([wav], `${file.name.replace(/\.[^.]+$/, "") || "speech-test"}.wav`, { type: "audio/wav" });
  } finally {
    await context.close();
  }
}

export default function SpeechTestPanel() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<SpeechTestConfig | null>(null);
  const [configError, setConfigError] = useState("");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [ttsStreaming, setTtsStreaming] = useState(false);
  const [ttsElapsed, setTtsElapsed] = useState<number | null>(null);
  const [ttsResultAdapter, setTtsResultAdapter] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [sttBusy, setSttBusy] = useState(false);
  const [sttError, setSttError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [sttElapsed, setSttElapsed] = useState<number | null>(null);
  const [sttResultAdapter, setSttResultAdapter] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [liveAdapter, setLiveAdapter] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const muteRef = useRef<GainNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const liveStartedAtRef = useRef<number | null>(null);
  const ttsSocketRef = useRef<WebSocket | null>(null);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const ttsScheduleRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    pipelineService.speechTestConfig()
      .then((next) => { if (active) setConfig(next); })
      .catch((error: unknown) => {
        if (active) setConfigError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.configError"));
      });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      muteRef.current?.disconnect();
      void audioContextRef.current?.close();
      socketRef.current?.close();
      ttsSocketRef.current?.close();
      void ttsAudioContextRef.current?.close();
    };
  }, [t]);

  const saveRecording = (blob: Blob) => {
    const normalizedType = (blob.type || "audio/webm").split(";")[0];
    const file = new File([blob], `speech-test-${Date.now()}.webm`, { type: normalizedType });
    setRecordedFile(file);
    setTranscript("");
    setSttError("");
  };

  const stopLiveRecognition = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    muteRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "stop" }));
    }
    setRecording(false);
  };

  const toggleRecording = async () => {
    if (recording) {
      stopLiveRecognition();
      return;
    }
    setSttError("");
    setTranscript("");
    setInterimTranscript("");
    setSttElapsed(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const token = localStorage.getItem("accessToken") ?? (() => {
        const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        try { return match ? decodeURIComponent(match[1]) : ""; } catch { return ""; }
      })();
      if (!token) throw new Error(t("aiPipeline.speech.test.authRequired"));
      const endpoint = new URL("/admin/ai/speech/test/transcribe/stream", API_BASE_URL);
      endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(endpoint, ["bearer", token]);
      socketRef.current = socket;
      socket.binaryType = "arraybuffer";
      socket.onmessage = (message) => {
        let event: { type?: string; text?: string; provider?: string; model?: string; detail?: string };
        try { event = JSON.parse(String(message.data)); } catch { return; }
        if (event.type === "ready") {
          const adapter = [event.provider, event.model].filter(Boolean).join(" · ");
          setLiveAdapter(adapter);
          setSttResultAdapter(adapter);
          return;
        }
        if (event.type === "interim") setInterimTranscript(event.text ?? "");
        if (event.type === "final") {
          const finalText = (event.text ?? "").trim();
          if (finalText) setTranscript((previous) => [previous, finalText].filter(Boolean).join(" "));
          setInterimTranscript("");
        }
        if (event.type === "error") setSttError(event.detail || t("aiPipeline.speech.test.sttError"));
        if (event.type === "stopped") {
          setRecording(false);
          const startedAt = liveStartedAtRef.current;
          setSttElapsed(startedAt === null ? null : Date.now() - startedAt);
          liveStartedAtRef.current = null;
        }
      };
      socket.onerror = () => setSttError(t("aiPipeline.speech.test.sttError"));
      socket.onclose = () => setRecording(false);
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.addEventListener("error", () => reject(new Error(t("aiPipeline.speech.test.sttError"))), { once: true });
      });
      const context = new AudioContext();
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const mute = context.createGain();
      mute.gain.value = 0;
      sourceRef.current = source;
      processorRef.current = processor;
      muteRef.current = mute;
      processor.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const input = event.inputBuffer.getChannelData(0);
        const ratio = context.sampleRate / 16_000;
        const count = Math.max(1, Math.floor(input.length / ratio));
        const pcm = new Int16Array(count);
        for (let index = 0; index < count; index += 1) {
          const position = index * ratio;
          const left = Math.floor(position);
          const right = Math.min(left + 1, input.length - 1);
          const fraction = position - left;
          const sample = Math.max(-1, Math.min(1, input[left] * (1 - fraction) + input[right] * fraction));
          pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        socket.send(pcm.buffer);
      };
      source.connect(processor);
      processor.connect(mute);
      mute.connect(context.destination);
      liveStartedAtRef.current = Date.now();
      setRecording(true);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setSttError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.micError"));
    }
  };

  const runTts = async () => {
    if (!text.trim()) return;
    setTtsBusy(true);
    setTtsError("");
    setTtsElapsed(null);
    setTtsStreaming(false);
    try {
      const token = localStorage.getItem("accessToken") ?? (() => {
        const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        try { return match ? decodeURIComponent(match[1]) : ""; } catch { return ""; }
      })();
      if (!token) throw new Error(t("aiPipeline.speech.test.authRequired"));
      const endpoint = new URL("/admin/ai/speech/test/speak/stream", API_BASE_URL);
      endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(endpoint, ["bearer", token]);
      socket.binaryType = "arraybuffer";
      ttsSocketRef.current = socket;
      const context = new AudioContext();
      ttsAudioContextRef.current = context;
      await context.resume();
      ttsScheduleRef.current = context.currentTime + 0.04;
      let sampleRate = 16_000;
      let channels = 1;
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => socket.send(JSON.stringify({ text: text.trim() }));
        socket.onmessage = (message) => {
          if (typeof message.data === "string") {
            const event = JSON.parse(message.data) as { type?: string; provider?: string; model?: string; sampleRate?: number; channels?: number; elapsedMs?: number; detail?: string };
            if (event.type === "ready") setTtsResultAdapter([event.provider, event.model].filter(Boolean).join(" · "));
            if (event.type === "audio") {
              sampleRate = event.sampleRate ?? sampleRate;
              channels = event.channels ?? channels;
              setTtsStreaming(true);
            }
            if (event.type === "done") {
              setTtsElapsed(event.elapsedMs ?? null);
              socket.close();
            }
            if (event.type === "error") {
              setTtsError(event.detail || t("aiPipeline.speech.test.ttsError"));
              socket.close();
              reject(new Error(event.detail || t("aiPipeline.speech.test.ttsError")));
            }
            return;
          }
          const pcm = new Int16Array(message.data as ArrayBuffer);
          const frameCount = Math.floor(pcm.length / channels);
          if (!frameCount) return;
          const audio = context.createBuffer(channels, frameCount, sampleRate);
          for (let channel = 0; channel < channels; channel += 1) {
            const output = audio.getChannelData(channel);
            for (let index = 0; index < frameCount; index += 1) {
              output[index] = pcm[index * channels + channel] / 32768;
            }
          }
          const source = context.createBufferSource();
          source.buffer = audio;
          source.connect(context.destination);
          const startAt = Math.max(ttsScheduleRef.current, context.currentTime + 0.02);
          source.start(startAt);
          ttsScheduleRef.current = startAt + audio.duration;
        };
        socket.onerror = () => reject(new Error(t("aiPipeline.speech.test.ttsError")));
        socket.onclose = () => resolve();
      });
    } catch (error) {
      setTtsError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.ttsError"));
    } finally {
      setTtsStreaming(false);
      setTtsBusy(false);
    }
  };

  const runStt = async () => {
    if (!recordedFile) return;
    setSttBusy(true);
    setSttError("");
    setTranscript("");
    try {
      const wavFile = await toMonoWav16k(recordedFile);
      const result = await pipelineService.testSpeechTranscription(wavFile);
      setTranscript(result.text);
      setSttElapsed(result.elapsedMs);
      setSttResultAdapter(`${result.provider} · ${result.model}`);
    } catch (error) {
      setSttError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.sttError"));
    } finally {
      setSttBusy(false);
    }
  };

  const canRunTts = Boolean(config?.ttsReady);
  const canRunStt = Boolean(config?.sttReady);

  return (
    <AdminSection
      title={t("aiPipeline.speech.test.title")}
      description={t("aiPipeline.speech.test.subtitle")}
    >
      {config ? (
        <div className="mb-4 space-y-2 text-xs text-[#607096]">
          <p>{t("aiPipeline.speech.test.integratedAdapters")}: <b className="font-semibold text-[#14244B]">{config.sttAdapters.join(" · ")}</b></p>
          <p>{t("aiPipeline.speech.test.activeStt")}: <b className="font-mono text-[#14244B]">{config.sttProvider} / {config.sttModel}</b></p>
          <p>{t("aiPipeline.speech.test.integratedTts")}: <b className="font-semibold text-[#14244B]">{config.ttsAdapters.join(" · ")}</b></p>
          <p>{t("aiPipeline.speech.test.activeTts")}: <b className="font-mono text-[#14244B]">{config.ttsProvider} / {config.ttsModel} / {config.ttsVoice}</b></p>
        </div>
      ) : configError ? (
        <p role="alert" className="mb-4 text-sm text-[#C43B3B]">{configError}</p>
      ) : (
        <p className="mb-4 text-sm text-[#607096]">{t("aiPipeline.speech.test.loading")}</p>
      )}
      {config && (!canRunTts || !canRunStt) ? (
        <p role="status" className="mb-4 rounded-xl bg-[#FFF7E6] px-3 py-2 text-sm text-[#8A5A00]">
          {t("aiPipeline.speech.test.adapterNotReady")}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-[#EAEFF8] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14244B]"><Volume2 size={17} />{t("aiPipeline.speech.test.ttsTitle")}</div>
          <label className="sr-only" htmlFor="speech-test-text">{t("aiPipeline.speech.test.textLabel")}</label>
          <textarea
            id="speech-test-text"
            value={text}
            maxLength={4096}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm text-[#14244B] outline-none focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/10"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void runTts()} disabled={!canRunTts || ttsBusy || !text.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#173477] disabled:cursor-not-allowed disabled:opacity-50">
              <Play size={15} />{ttsBusy ? t("aiPipeline.speech.test.working") : t("aiPipeline.speech.test.synthesize")}
            </button>
            <span className="text-xs text-[#607096]">{text.length}/4096</span>
            {ttsElapsed !== null ? <span className="text-xs text-[#287A4B]">{fill(t("aiPipeline.speech.test.elapsed"), { ms: ttsElapsed })}</span> : null}
          </div>
          {ttsResultAdapter ? <p className="mt-3 text-xs font-medium text-[#607096]">{ttsResultAdapter}</p> : null}
          {ttsStreaming ? <p role="status" className="mt-2 text-xs text-[#287A4B]">{t("aiPipeline.speech.test.speaking")}</p> : null}
          {ttsError ? <p role="alert" className="mt-2 text-sm text-[#C43B3B]">{ttsError}</p> : null}
        </div>

        <div className="rounded-xl border border-[#EAEFF8] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14244B]"><Radio size={17} />{t("aiPipeline.speech.test.sttTitle")}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void toggleRecording()} disabled={!canRunStt || sttBusy} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${recording ? "bg-[#FDF2F2] text-[#C43B3B]" : "bg-[#204195] text-white hover:bg-[#173477]"}`}>
              {recording ? <MicOff size={16} /> : <Mic size={16} />}{recording ? t("aiPipeline.speech.test.stopRecording") : t("aiPipeline.speech.test.liveRecord")}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!canRunStt || recording || sttBusy} className="rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-sm font-semibold text-[#204195] hover:bg-[#F7F9FD] disabled:cursor-not-allowed disabled:opacity-50">
              {t("aiPipeline.speech.test.chooseFile")}
            </button>
            <input ref={fileInputRef} type="file" accept="audio/webm,audio/wav,audio/x-wav,audio/mpeg,audio/mp4,.mp3,.wav,.webm,.mp4" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) saveRecording(file);
              event.target.value = "";
            }} />
          </div>
          <p className="mt-2 text-xs text-[#607096]">{recording ? t("aiPipeline.speech.test.liveHelp") : recordedFile ? `${recordedFile.name} · ${(recordedFile.size / 1024).toFixed(0)} KB` : t("aiPipeline.speech.test.sttHelp")}</p>
          {liveAdapter ? <p className="mt-2 text-xs font-medium text-[#607096]">{liveAdapter}</p> : null}
          {recording || transcript || interimTranscript ? (
            <div aria-live="polite" className="mt-3 min-h-20 rounded-xl bg-[#F7F9FD] p-3 text-sm leading-6 text-[#14244B]">
              {transcript || interimTranscript ? <>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#607096]">{t("aiPipeline.speech.test.liveTranscript")}</p>
                {transcript ? <span>{transcript} </span> : null}
                {interimTranscript ? <span className="text-[#607096]">{interimTranscript}</span> : null}
              </> : <span className="text-[#607096]">{t("aiPipeline.speech.test.listening")}</span>}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void runStt()} disabled={!canRunStt || !recordedFile || recording || sttBusy} className="rounded-xl bg-[#204195] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#173477] disabled:cursor-not-allowed disabled:opacity-50">
              {sttBusy ? t("aiPipeline.speech.test.working") : t("aiPipeline.speech.test.transcribe")}
            </button>
            {sttElapsed !== null ? <span className="text-xs text-[#287A4B]">{fill(t("aiPipeline.speech.test.elapsed"), { ms: sttElapsed })}</span> : null}
          </div>
          {transcript ? <div className="mt-3 rounded-xl bg-[#F7F9FD] p-3 text-sm leading-6 text-[#14244B]"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#607096]">{sttResultAdapter}</p>{transcript}</div> : null}
          {sttError ? <p role="alert" className="mt-2 text-sm text-[#C43B3B]">{sttError}</p> : null}
        </div>
      </div>
    </AdminSection>
  );
}
