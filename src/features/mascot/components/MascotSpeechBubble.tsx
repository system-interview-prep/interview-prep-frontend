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
        'relative rounded-2xl border-2 border-[#204195] bg-[#FEF9EE] px-4 py-2.5 text-xs font-semibold text-[#204195] shadow-[3px_3px_0_#204195] animate-in fade-in zoom-in-95 duration-200',
        className
      )}
    >
      <div className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#204195] bg-[#FEF9EE]" />
      <span>{text}</span>
    </div>
  );
}

export default MascotSpeechBubble;
