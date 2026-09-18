export type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
  /** Unix ms for message time display */
  sentAt?: number;
  audioBase64?: string;
  audioMimeType?: string;
};

export type VoiceRecognitionConstructor = new () => VoiceRecognitionInstance;

export type VoiceRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: VoiceRecognitionResultEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

export type VoiceRecognitionResultEvent = {
  resultIndex?: number;
  results: VoiceRecognitionResult[];
};

export type VoiceRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: VoiceRecognitionAlternative;
};

export type VoiceRecognitionAlternative = {
  transcript: string;
};

export type VoiceRecognitionErrorEvent = {
  error: string;
  message?: string;
};
