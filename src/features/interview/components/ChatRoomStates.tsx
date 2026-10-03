import { AlertCircle, Bot, RefreshCw } from 'lucide-react';

export function ChatRoomLoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800"
    >
      <div className="relative flex items-center justify-center">
        <div className="size-16 animate-pulse rounded-2xl bg-indigo-600/10" />
        <Bot className="absolute size-8 animate-bounce text-indigo-600" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">Đang khởi tạo phòng phỏng vấn...</h2>
        <p className="mt-1 text-xs text-slate-500">Đang đồng bộ hồ sơ và kết nối AI Interviewer</p>
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
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Không thể bắt đầu phỏng vấn</h3>
        <p role="alert" className="mt-2 text-sm leading-relaxed text-slate-600">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <RefreshCw className="size-4" /> Thử lại
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Quay về
          </button>
        </div>
      </div>
    </div>
  );
}
