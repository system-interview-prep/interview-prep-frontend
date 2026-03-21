'use client';

interface Props {
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onHangUp: () => void;
  isConnected: boolean;
}

export default function ControlBar({ onToggleMic, onToggleCamera, onHangUp, isConnected }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 py-3 bg-gray-800 rounded-xl">
      <button
        onClick={onToggleMic}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        🎙️ Toggle Mic
      </button>

      <button
        onClick={onToggleCamera}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        📷 Toggle Camera
      </button>

      <button
        onClick={onHangUp}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
      >
        📵 Hang Up
      </button>

      <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-700 text-green-200' : 'bg-gray-600 text-gray-400'}`}>
        {isConnected ? '● Connected' : '○ Disconnected'}
      </span>
    </div>
  );
}
