export type TranslatorAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

interface BrowserTranslator {
  translate(input: string): Promise<string>;
  destroy?: () => void;
}

const INLINE_MARKDOWN_TOKEN = /(`+[^`\n]*`+|!?\[[^\]\n]*\]\([^\n)]*\)|<[^>\n]+>|https?:\/\/[^\s)]+|\\[\\`*{}\[\]()#+\-.!_>|~]|[*_~]{1,3}|\|)/g;
const INLINE_MARKDOWN_TOKEN_EXACT = /^(`+[^`\n]*`+|!?\[[^\]\n]*\]\([^\n)]*\)|<[^>\n]+>|https?:\/\/[^\s)]+|\\[\\`*{}\[\]()#+\-.!_>|~]|[*_~]{1,3}|\|)$/;
const BLOCK_PREFIX = /^(\s*(?:(?:>\s*)+)?(?:(?:#{1,6}|[-+*]|\d+[.)])\s+)?(?:\[[ xX]\]\s+)?)(.*)$/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const HORIZONTAL_RULE = /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/;
const TABLE_SEPARATOR = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;

interface TranslatorMonitor {
  addEventListener(
    type: "downloadprogress",
    listener: (event: Event & { loaded: number }) => void,
  ): void;
}

interface BrowserTranslatorApi {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<TranslatorAvailability>;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: TranslatorMonitor) => void;
  }): Promise<BrowserTranslator>;
}

type TranslatorHost = typeof globalThis & {
  Translator?: BrowserTranslatorApi;
};

export class BrowserTranslationUnavailable extends Error {
  constructor() {
    super("Browser Translator API is unavailable");
    this.name = "BrowserTranslationUnavailable";
  }
}

async function translatePlainText(text: string, translator: BrowserTranslator): Promise<string> {
  if (!/[A-Za-z]/.test(text)) return text;

  const whitespace = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!whitespace || !whitespace[2]) return text;
  const translated = await translator.translate(whitespace[2]);
  return `${whitespace[1]}${translated}${whitespace[3]}`;
}

async function translateInlineMarkdown(
  text: string,
  translator: BrowserTranslator,
): Promise<string> {
  const parts = text.split(INLINE_MARKDOWN_TOKEN);
  const translated: string[] = [];

  for (const part of parts) {
    if (!part) continue;

    const link = part.match(/^(!?\[)([^\]]*)(\]\([^)]*\))$/);
    if (link) {
      translated.push(
        `${link[1]}${await translateInlineMarkdown(link[2], translator)}${link[3]}`,
      );
    } else if (INLINE_MARKDOWN_TOKEN_EXACT.test(part)) {
      translated.push(part);
    } else {
      translated.push(await translatePlainText(part, translator));
    }
  }

  return translated.join("");
}

async function translateMarkdown(input: string, translator: BrowserTranslator): Promise<string> {
  const parts = input.split(/(\r?\n)/);
  const translated: string[] = [];
  let fenceMarker: string | null = null;

  for (const part of parts) {
    if (part === "\n" || part === "\r\n") {
      translated.push(part);
      continue;
    }

    const fence = part.match(FENCE);
    if (fence) {
      const marker = fence[1][0];
      if (fenceMarker === null) fenceMarker = marker;
      else if (fenceMarker === marker) fenceMarker = null;
      translated.push(part);
      continue;
    }
    if (
      fenceMarker !== null
      || /^(?: {4}|\t)/.test(part)
      || HORIZONTAL_RULE.test(part)
      || TABLE_SEPARATOR.test(part)
    ) {
      translated.push(part);
      continue;
    }

    const block = part.match(BLOCK_PREFIX);
    if (!block) {
      translated.push(part);
      continue;
    }
    translated.push(block[1], await translateInlineMarkdown(block[2], translator));
  }

  return translated.join("");
}

export async function translateEnglishToVietnameseInBrowser(
  input: string,
  onDownloadProgress?: (progress: number) => void,
  host: TranslatorHost = globalThis as TranslatorHost,
): Promise<string> {
  const translatorApi = host.Translator;
  if (!translatorApi) {
    throw new BrowserTranslationUnavailable();
  }

  const options = { sourceLanguage: "en", targetLanguage: "vi" };
  const availability = await translatorApi.availability(options);
  if (availability === "unavailable") {
    throw new BrowserTranslationUnavailable();
  }

  const translator = await translatorApi.create({
    ...options,
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        onDownloadProgress?.(Math.round(event.loaded * 100));
      });
    },
  });

  try {
    return await translateMarkdown(input, translator);
  } finally {
    translator.destroy?.();
  }
}
