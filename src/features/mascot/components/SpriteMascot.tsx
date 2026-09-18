"use client";

import React, { useEffect, useState } from "react";

import { type MascotMood } from '../types';

export interface SpriteMascotProps {
  mood?: MascotMood;
  className?: string;
}

export function SpriteMascot({ mood = "idle", className = "" }: SpriteMascotProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#204195] to-[#FCB625] flex items-center justify-center shadow-lg transition-transform hover:scale-105">
        <span className="text-3xl font-bold text-white">🤖</span>
      </div>
    </div>
  );
}

export default SpriteMascot;
