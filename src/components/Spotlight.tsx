"use client";

import { useRef } from "react";

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export default function Spotlight({ children, className = "" }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group/spot relative overflow-hidden ${className}`}
      style={{ ["--spot-x" as string]: "50%", ["--spot-y" as string]: "0%" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out-expo group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--spot-x) var(--spot-y), rgb(254 44 85 / 0.1), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}