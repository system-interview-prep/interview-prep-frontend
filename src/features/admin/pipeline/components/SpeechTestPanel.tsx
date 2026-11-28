"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Play, Radio, Volume2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { API_BASE_URL } from "@/constants";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { resolveBackendErrorMessage } from "@/utils/backendError";
import { pipelineService, type SpeechTestConfig } from "../services/pipeline.service";
import { fill } from "../utils/pipelineFormat";
import { LivekitSttClient } from "../services/livekitSttClient";

const DEFAULT_TEXT = "Xin chào, đây là bài kiểm tra giọng nói của hệ thống phỏng vấn.";
const STT_SAMPLE_RATE = 16_000;

async function toMonoWav16k(file: File): Promise<File> {
  const context = new AudioContext();
  try {
    const source = await context.decodeAudioData(await file.arrayBuffer());
    const sampleCount = Math.max(1, Math.floor(source.duration * STT_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, sampleCount, STT_SAMPLE_RATE);
    const sourceNode = offline.createBufferSource();
    sourceNode.buffer = source;
    sourceNode.connect(offline.destination);
    sourceNode.start();
    const normalizedAudio = await offline.startRendering();
    const mono = normalizedAudio.getChannelData(0);

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
  const [quality, setQuality] = useState<{ accepted: boolean; reason: string } | null>(null);
  const [sttElapsed, setSttElapsed] = useState<number | null>(null);
  const [sttResultAdapter, setSttResultAdapter] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [liveAdapter, setLiveAdapter] = useState("");
  const [sttContext, setSttContext] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [sttTestId, setSttTestId] = useState("");
  const [traceEnabled, setTraceEnabled] = useState<boolean | null>(null);
  const liveSttRef = useRef<LivekitSttClient | null>(null);
  const sttAttemptRef = useRef(0);
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
      sttAttemptRef.current += 1;
      liveSttRef.current?.close();
      ttsSocketRef.current?.close();
      void ttsAudioContextRef.current?.close();
    };
  }, [t]);

  const saveRecording = (blob: Blob) => {
    const normalizedType = (blob.type || "audio/webm").split(";")[0];
    const file = new File([blob], `speech-test-${Date.now()}.webm`, { type: normalizedType });
    setRecordedFile(file);
    setTranscript("");
    setQuality(null);
    setSttError("");
    setSttTestId("");
    setTraceEnabled(null);
  };

  const toggleRecording = async () => {
    if (recording) {
      setSttBusy(true);
      setRecording(false);
      await liveSttRef.current?.stop();
      return;
    }
    setSttError("");
    setTranscript("");
    setQuality(null);
    setInterimTranscript("");
    setSttElapsed(null);
    setSttTestId("");
    setTraceEnabled(null);
    setSttBusy(true);
    const attempt = ++sttAttemptRef.current;
    try {
      const token = await pipelineService.createSttTestRoom({ context: sttContext, referenceText });
      if (attempt !== sttAttemptRef.current) return;
      setSttTestId(token.testId);
      setTraceEnabled(token.traceEnabled);
      const client = new LivekitSttClient((event) => {
        if (event.type === "ready") {
          const adapter = ["LiveKit", event.provider, event.model].filter(Boolean).join(" / ");
          setLiveAdapter(adapter);
          setSttResultAdapter(adapter);
          setTraceEnabled(event.traceEnabled ?? token.traceEnabled);
        }
        if (event.type === "interim") setInterimTranscript(event.text ?? "");
        if (event.type === "final") {
          const finalText = (event.text ?? "").trim();
          if (finalText) setTranscript((previous) => [previous, finalText].filter(Boolean).join(" "));
          if (typeof event.qualityAccepted === "boolean") {
            setQuality({ accepted: event.qualityAccepted, reason: event.qualityReason ?? "unknown" });
          }
          setInterimTranscript("");
        }
        if (event.type === "stopped") {
          setRecording(false);
          setSttBusy(false);
          setSttElapsed(event.elapsedMs ?? null);
          if (event.traceDelivered === false || !["stopped", "disconnected"].includes(event.status ?? "")) {
            setSttError(t("aiPipeline.speech.test.sttError"));
          }
        }
      }, (error) => {
        setRecording(false);
        setSttBusy(false);
        setSttError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.sttError"));
      });
      liveSttRef.current = client;
      await client.connect(token);
      if (attempt !== sttAttemptRef.current) { client.close(); return; }
      setRecording(true);
      setSttBusy(false);
    } catch (error) {
      if (attempt !== sttAttemptRef.current) return;
      liveSttRef.current?.close();
      setRecording(false);
      setSttBusy(false);
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
    setQuality(null);
    setSttTestId("");
    setTraceEnabled(null);
    try {
      const wavFile = await toMonoWav16k(recordedFile);
      const result = await pipelineService.testSpeechTranscription(wavFile, { context: sttContext, referenceText });
      setTranscript(result.text);
      setQuality({ accepted: result.qualityAccepted, reason: result.qualityReason });
      setSttElapsed(result.elapsedMs);
      setSttResultAdapter(`${result.provider} · ${result.model}`);
      setSttTestId(result.testId);
      setTraceEnabled(result.traceEnabled);
    } catch (error) {
      setSttError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.sttError"));
    } finally {
      setSttBusy(false);
    }
  };

  const canRunTts = Boolean(config?.ttsReady);
  const canRunStt = Boolean(config?.sttReady);
  const canRunLiveStt = Boolean(config?.livekitSttReady);

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
      {config && (!canRunTts || !canRunStt || !canRunLiveStt) ? (
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
          <label className="mb-1 block text-xs font-semibold text-[#607096]" htmlFor="stt-test-context">
            {t("aiPipeline.speech.test.contextLabel")}
          </label>
          <input id="stt-test-context" value={sttContext} maxLength={4000} disabled={recording || sttBusy}
            onChange={(event) => setSttContext(event.target.value)}
            className="mb-3 w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm text-[#14244B]" />
          <label className="mb-1 block text-xs font-semibold text-[#607096]" htmlFor="stt-test-reference">
            {t("aiPipeline.speech.test.referenceLabel")}
          </label>
          <textarea id="stt-test-reference" value={referenceText} maxLength={16000} rows={3}
            disabled={recording || sttBusy} onChange={(event) => setReferenceText(event.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm text-[#14244B]" />
          <p className="mb-3 text-xs text-[#607096]">{t("aiPipeline.speech.test.referenceHelp")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void toggleRecording()} disabled={!canRunLiveStt || sttBusy} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${recording ? "bg-[#FDF2F2] text-[#C43B3B]" : "bg-[#204195] text-white hover:bg-[#173477]"}`}>
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
          {quality ? <p role="status" className={`mt-2 text-xs font-semibold ${quality.accepted ? "text-[#287A4B]" : "text-[#C43B3B]"}`}>
            {t(quality.accepted ? "aiPipeline.speech.test.interviewAccepts" : "aiPipeline.speech.test.interviewRejects")}
            {!quality.accepted ? ` (${quality.reason})` : ""}
          </p> : null}
          {sttError ? <p role="alert" className="mt-2 text-sm text-[#C43B3B]">{sttError}</p> : null}
          {sttTestId ? <p className="mt-2 break-all text-xs text-[#607096]">
            {t("aiPipeline.speech.test.traceId")}: <span className="font-mono">{sttTestId}</span>
          </p> : null}
          {traceEnabled === false ? <p role="status" className="mt-2 text-xs text-[#8A5A00]">
            {t("aiPipeline.speech.test.traceDisabled")}
          </p> : null}
        </div>
      </div>
    </AdminSection>
  );
}
