"use client";

import React, { useRef } from 'react';
import SpriteMascot from './SpriteMascot';
import MascotSpeechBubble from './MascotSpeechBubble';
import { useMouseTracking } from '../hooks/useMouseTracking';
import type { MascotContainerProps } from '../types';
import { cn } from '@/utils';

export function MascotContainer({
  mood = 'idle',
  speechText,
  className,
}: MascotContainerProps) {
  const mascotRef = useRef<HTMLDivElement>(null);
  useMouseTracking(mascotRef);

  return (
    <div ref={mascotRef} className={cn('flex flex-col items-center gap-2 select-none', className)}>
      {speechText && <MascotSpeechBubble text={speechText} />}
      <SpriteMascot mood={mood} />
    </div>
  );
}

export default MascotContainer;
