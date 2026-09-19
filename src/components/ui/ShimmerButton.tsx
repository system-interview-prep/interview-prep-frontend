"use client";

import React from "react";
import { cn } from "@/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#FCB625",
      shimmerSize = "0.15em",
      shimmerDuration = "2.5s",
      borderRadius = "9999px",
      background = "#204195",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--sk-shimmer-color": shimmerColor,
            "--sk-radius": borderRadius,
            "--sk-speed": shimmerDuration,
            "--sk-cut": shimmerSize,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex h-12 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-8 text-white font-bold transition-all duration-300 active:scale-95",
          "shadow-md hover:shadow-[0_8px_25px_rgba(252,182,37,0.4)] hover:scale-[1.02]",
          "rounded-full",
          className
        )}
        {...props}
      >
        {/* Sparkle Glow Background */}
        <div
          className={cn(
            "-z-30 absolute inset-0 overflow-visible [container-type:size]",
            "[radial-gradient(ellipse_at_center,_var(--sk-shimmer-color)_0%,_transparent_70%)]"
          )}
        />

        {/* Shimmer Border Light animation */}
        <div className="absolute inset-0 -z-20 rounded-[inherit] overflow-hidden p-[2px]">
          <div className="absolute -inset-[100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_75%,var(--sk-shimmer-color)_100%)] opacity-80 group-hover:opacity-100" />
        </div>

        {/* Button Content Mask */}
        <div
          style={{ backgroundColor: background }}
          className="absolute inset-[2px] -z-10 rounded-[inherit] transition-colors duration-200 group-hover:brightness-110"
        />

        {/* Children */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
export default ShimmerButton;
