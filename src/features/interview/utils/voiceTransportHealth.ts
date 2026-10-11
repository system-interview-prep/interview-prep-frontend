export function voiceTransportHealthMessage(
  event: Record<string, unknown>,
  locale: string,
): string | null | undefined {
  if (event.type === 'voice.transport.recovered') return null;
  if (event.type !== 'voice.transport.degraded') return undefined;

  const isStt = event.component === 'stt';
  const retrying = event.recoverable !== false;
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
