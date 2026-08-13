"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "danger" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

type PushToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<PushToast>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback<PushToast>((message, tone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const toneClass: Record<Tone, string> = {
    success: "border-success/40 bg-success/15 text-success",
    danger: "border-danger/40 bg-danger/15 text-danger",
    info: "border-white/15 bg-surface-2 text-fg",
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-card animate-[fadeIn_.2s_ease] ${toneClass[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
