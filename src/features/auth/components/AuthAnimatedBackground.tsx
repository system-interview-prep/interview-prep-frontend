import React from "react";

/**
 * Quiet paper backdrop for auth screens. No glows, orbits or floating cards:
 * the fox beside the form does the talking.
 */
export function AuthAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden bg-[#F7F9FD]" aria-hidden="true">
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#EEF3FC]" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#F0F4FC]/60" />
    </div>
  );
}
