"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stagger entrance (ms), applied once when the element first enters the viewport. */
  delayMs?: number;
};

export default function AnimateOnScroll({ children, className = "", style, delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`animate-on-scroll transform-gpu ${className}`.trim()}
      style={{
        ...style,
        ...(delayMs ? { transitionDelay: `${delayMs}ms` } : {}),
      }}
    >
      {children}
    </div>
  );
}
