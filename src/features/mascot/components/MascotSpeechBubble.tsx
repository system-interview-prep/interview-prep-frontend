import React from 'react';
import { cn } from '@/utils';

export interface MascotSpeechBubbleProps {
  text: string;
  className?: string;
}

export function MascotSpeechBubble({ text, className }: MascotSpeechBubbleProps) {
  if (!text) return null;

  return (
    <div
      className={cn(
        'relative max-w-[260px] rounded-2xl border border-[#DCE4F3] bg-white/98 backdrop-blur-xs px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-[#506085] shadow-[0_10px_30px_rgba(20,36,75,0.08)] animate-in fade-in zoom-in-95 duration-200 select-none pointer-events-none',
        className
      )}
    >
      <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-[#DCE4F3] bg-white" />
      <span>{text}</span>
    </div>
  );
}

export default MascotSpeechBubble;

