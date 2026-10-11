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
};

function phraseKey(value: string): string {
  return value.toLocaleLowerCase('en').replace(/[^a-z-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Keep the live caption consistent with the locale-corrected server transcript. */
export function normalizeVoiceTranscript(text: string, locale: string, speaker: 'user' | 'ai'): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (speaker !== 'user' || !locale.toLocaleLowerCase().startsWith('vi')) return cleaned;
  return VI_SHORT_STT_ARTIFACTS[phraseKey(cleaned)] ?? cleaned;
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
    for (let index = previous.length - 1; index >= Math.max(0, previous.length - 5); index -= 1) {
      const candidate = previous[index];
      if (candidate.speaker !== 'ai') continue;
      const between = previous.slice(index + 1);
      const onlyRecoveryChatter = between.every(
        (line) => line.speaker === 'user' && isVoiceRecoveryUtterance(line.text, locale),
      );
      if (onlyRecoveryChatter && next.text.startsWith(candidate.text) && next.text !== candidate.text) {
        return [...previous.slice(0, index), next].slice(-100);
      }
      break;
    }
  }

  const last = previous[previous.length - 1];
  if (last && last.speaker === next.speaker) {
    return [
      ...previous.slice(0, -1),
      { ...last, id: next.id, text: `${last.text} ${next.text}`.trim() },
    ].slice(-100) as T[];
  }
  return [...previous, next].slice(-100);
}
