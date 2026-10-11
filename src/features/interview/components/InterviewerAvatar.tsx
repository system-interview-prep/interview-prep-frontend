import { cn } from "@/utils";

/**
 * The AI interviewer's face in rooms: a neutral brand badge, not the fox
 * (the fox is only the app's assistant). Same footprint as the old avatar.
 */
export function InterviewerAvatar({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#204195] to-[#14244B] font-semibold tracking-tight text-white ring-2 ring-white/70",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.36)) }}
    >
      AI
    </span>
  );
}

export default InterviewerAvatar;
