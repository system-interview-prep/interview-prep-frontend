export function voiceTransportHealthMessage(
  event: Record<string, unknown>,
  locale: string,
): string | null | undefined {
  if (event.type === 'voice.transport.recovered') return null;
  if (event.type !== 'voice.transport.degraded') return undefined;

  const isStt = event.component === 'stt';
  const retrying = event.recoverable !== false;
  // HTTP 429 from the speech provider: the plan's connection cap or its
  // monthly usage allowance. Reconnecting opens one more connection and cannot
  // help, so offer the chat room instead.
  if (event.reason === 'rate_limited') {
    return locale.toLowerCase().startsWith('vi')
      ? 'Dịch vụ nhận giọng nói đang tạm hết hạn mức. Bạn có thể luyện bằng chế độ chat hoặc thử lại sau; mở thêm phòng không giúp được.'
      : 'Speech recognition has reached its usage limit for now. You can practise in chat mode or try again later; opening another room will not help.';
  }
  if (locale.toLowerCase().startsWith('vi')) {
    const component = isStt ? 'nhận diện giọng nói' : 'âm thanh';
    return retrying
      ? `Dịch vụ ${component} tạm thời gián đoạn và đang tự phục hồi. Vui lòng tạm dừng nói.`
      : `Dịch vụ ${component} không khả dụng. Hãy kết nối lại phòng phỏng vấn.`;
  }
  const component = isStt ? 'speech recognition' : 'audio';
  return retrying
    ? `The ${component} service is recovering. Please pause speaking.`
    : `The ${component} service is unavailable. Please reconnect.`;
}
