"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Play, Radio, Volume2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
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
  const [audioUrl, setAudioUrl] = useState("");
  const [ttsElapsed, setTtsElapsed] = useState<number | null>(null);
  const [ttsResultAdapter, setTtsResultAdapter] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [sttBusy, setSttBusy] = useState(false);
  const [sttError, setSttError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [sttElapsed, setSttElapsed] = useState<number | null>(null);
  const [sttResultAdapter, setSttResultAdapter] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef("");
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
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [t]);

  const saveRecording = (blob: Blob) => {
    const normalizedType = (blob.type || "audio/webm").split(";")[0];
    const file = new File([blob], `speech-test-${Date.now()}.webm`, { type: normalizedType });
    setRecordedFile(file);
    setTranscript("");
    setSttError("");
  };

  const toggleRecording = async () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    setSttError("");
    setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        saveRecording(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      setSttError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.micError"));
    }
  };

  const runTts = async () => {
    if (!text.trim()) return;
    setTtsBusy(true);
    setTtsError("");
    setTtsElapsed(null);
    try {
      const result = await pipelineService.testSpeechSynthesis(text.trim());
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const nextUrl = URL.createObjectURL(result.audio);
      objectUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
      setTtsElapsed(result.elapsedMs);
      setTtsResultAdapter([result.provider, result.model].filter(Boolean).join(" · "));
    } catch (error) {
      setTtsError(resolveBackendErrorMessage(error, t, "aiPipeline.speech.test.ttsError"));
    } finally {
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
          {audioUrl ? <>
            {ttsResultAdapter ? <p className="mt-3 text-xs font-medium text-[#607096]">{ttsResultAdapter}</p> : null}
            <audio className="mt-2 w-full" controls src={audioUrl}>{t("aiPipeline.speech.test.audioUnsupported")}</audio>
          </> : null}
          {ttsError ? <p role="alert" className="mt-2 text-sm text-[#C43B3B]">{ttsError}</p> : null}
        </div>

        <div className="rounded-xl border border-[#EAEFF8] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14244B]"><Radio size={17} />{t("aiPipeline.speech.test.sttTitle")}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void toggleRecording()} disabled={!canRunStt || sttBusy} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${recording ? "bg-[#FDF2F2] text-[#C43B3B]" : "bg-[#204195] text-white hover:bg-[#173477]"}`}>
              {recording ? <MicOff size={16} /> : <Mic size={16} />}{recording ? t("aiPipeline.speech.test.stopRecording") : t("aiPipeline.speech.test.record")}
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
          <p className="mt-2 text-xs text-[#607096]">{recordedFile ? `${recordedFile.name} · ${(recordedFile.size / 1024).toFixed(0)} KB` : t("aiPipeline.speech.test.sttHelp")}</p>
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
