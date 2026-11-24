const VI_SHORT_STT_ARTIFACTS: Record<string, string> = {
  yeah: 'Dạ.',
  yah: 'Dạ.',
  ya: 'Dạ.',
  yep: 'Dạ.',
  yes: 'Dạ.',
  'yeah yeah': 'Dạ, dạ.',
  'yah yah': 'Dạ, dạ.',
  'yep yep': 'Dạ, dạ.',
  'uh huh': 'Vâng.',
  'uh-huh': 'Vâng.',
  'mm hmm': 'Vâng.',
  mhm: 'Vâng.',
  hello: 'Alô.',
  'hello hello': 'Alô, alô.',
};

// Mirrors the agent's normalize_transcript_for_locale: "dạ"/"alô" opening a
// Vietnamese sentence is decoded as "Yeah, …"/"Hello, …". Only that filler is
// rewritten, and only when the rest is Vietnamese.
const VI_LEADING_STT_ARTIFACTS: Record<string, string> = {
  yeah: 'Dạ',
  yah: 'Dạ',
  yep: 'Dạ',
  yes: 'Dạ',
  hello: 'Alô',
};
const LEADING_FILLER = /^(yeah|yah|yep|yes|hello)\b[,.!?]?\s+(?=\S)/i;
const VIETNAMESE_LETTER = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function phraseKey(value: string): string {
  return value.toLocaleLowerCase('en').replace(/[^a-z-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Keep the live caption consistent with the locale-corrected server transcript. */
export function normalizeVoiceTranscript(text: string, locale: string, speaker: 'user' | 'ai'): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (speaker !== 'user' || !locale.toLocaleLowerCase().startsWith('vi')) return cleaned;
  const exact = VI_SHORT_STT_ARTIFACTS[phraseKey(cleaned)];
  if (exact) return exact;
  const leading = LEADING_FILLER.exec(cleaned);
  const rest = leading ? cleaned.slice(leading[0].length) : '';
  if (leading && VIETNAMESE_LETTER.test(rest)) {
    return `${VI_LEADING_STT_ARTIFACTS[leading[1].toLowerCase()]}, ${rest}`;
  }
  return cleaned;
}

type VoiceTranscriptLine = {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
};

function foldedPhrase(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Utterances used to control/recover playout, not meaningful interview answers. */
export function isVoiceRecoveryUtterance(text: string, locale: string): boolean {
  const phrase = foldedPhrase(text);
  const commonGreetings = new Set(['alo', 'hello', 'hi', 'hey', 'xin chao']);
  if (commonGreetings.has(phrase)) return true;

  const markers = locale.toLocaleLowerCase().startsWith('vi')
    ? [
        'bi dut doan',
        'bi gian doan',
        'am thanh bi ngat',
        'chua nghe ro',
        'khong nghe ro',
        'lap lai',
        'nhac lai',
        'noi lai',
        'hoi lai',
      ]
    : ['audio cut out', 'audio is cutting out', 'could not hear', 'did not hear', 'repeat that', 'say again'];
  return markers.some((marker) => phrase.includes(marker));
}

function comparableText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function firstSentence(text: string): string {
  const end = text.search(/[.?!…]/);
  return end === -1 ? text : text.slice(0, end + 1);
}

/**
 * Replace a cancelled assistant prefix plus recovery chatter with the complete
 * replay. LiveKit finalizes the cancelled prefix, so simple append-only UI
 * state otherwise renders one question as several unrelated bubbles.
 */
export function reconcileVoiceTranscript<T extends VoiceTranscriptLine>(
  previous: T[],
  next: T,
  locale: string,
): T[] {
  if (next.speaker === 'ai') {
    const nextText = comparableText(next.text);
    for (let index = previous.length - 1; index >= Math.max(0, previous.length - 5); index -= 1) {
      const candidate = previous[index];
      if (candidate.speaker !== 'ai') continue;
      const candidateText = comparableText(candidate.text);
      const between = previous.slice(index + 1);
      const onlyRecoveryChatter = between.every(
        (line) => line.speaker === 'user' && isVoiceRecoveryUtterance(line.text, locale),
      );
      const completesPrefix = nextText.startsWith(candidateText) && nextText !== candidateText;
      // The agent started the same line over (a reconnect, or "Nhắc lại"):
      // keep one copy instead of gluing the replay onto the cut-off one.
      const restartsLine =
        between.length === 0 && firstSentence(candidateText).length >= 12 && firstSentence(candidateText) === firstSentence(nextText);
      if (onlyRecoveryChatter && (completesPrefix || restartsLine)) {
        return [...previous.slice(0, index), next].slice(-100);
      }
      break;
    }
  }

  const last = previous[previous.length - 1];
  // A clause cut mid-sentence joins the line before it. The agent speaks each
  // paragraph separately, so an AI line that already ended a sentence starts
  // a new bubble instead of growing one long block.
  const aiLineFinished = next.speaker === 'ai' && /[.?!…]["”)]?$/.test(last?.text.trim() ?? '');
  if (last && last.speaker === next.speaker && !aiLineFinished) {
    return [
      ...previous.slice(0, -1),
      { ...last, id: next.id, text: `${last.text} ${next.text}`.trim() },
    ].slice(-100) as T[];
  }
  return [...previous, next].slice(-100);
}
