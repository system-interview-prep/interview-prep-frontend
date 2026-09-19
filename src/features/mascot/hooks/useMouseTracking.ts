"use client";

import { useEffect, useState, type RefObject } from 'react';
import type { EyePosition } from '../types';

export function useMouseTracking(targetRef?: RefObject<HTMLElement | null>): EyePosition {
  const [eyePosition, setEyePosition] = useState<EyePosition>({ angle: 0, distance: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!targetRef?.current) {
        setEyePosition({ angle: 0, distance: 0 });
        return;
      }

      const rect = targetRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      // Calculate eye angle using Math.atan2
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const distance = Math.min(Math.hypot(deltaX, deltaY) / 20, 8);

      setEyePosition({ angle, distance });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [targetRef]);

  return eyePosition;
}

export default useMouseTracking;
