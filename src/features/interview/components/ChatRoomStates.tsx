import { AlertCircle, Bot, RefreshCw } from 'lucide-react';

export function ChatRoomLoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F7F9FD] text-[#14244B]"
    >
      <div className="relative flex items-center justify-center">
        <div className="size-16 animate-pulse rounded-2xl bg-[#204195]/10" />
        <Bot className="absolute size-8 animate-bounce text-[#204195]" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#14244B]">Đang khởi tạo phòng phỏng vấn...</h2>
        <p className="mt-1 text-xs text-[#607096]">Đang đồng bộ hồ sơ và kết nối AI Interviewer</p>
      </div>
    </div>
  );
}

export function ChatRoomErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F7F9FD] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4F3] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-[#14244B]">Không thể bắt đầu phỏng vấn</h3>
        <p role="alert" className="mt-2 text-sm leading-relaxed text-[#607096]">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#204195] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#183273]"
          >
            <RefreshCw className="size-4" /> Thử lại
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 text-sm font-medium text-[#14244B] transition hover:bg-[#F7F9FD]"
          >
            Quay về
          </button>
        </div>
      </div>
    </div>
  );
}
