"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-lg border border-white/10 bg-surface p-4 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="mb-2 font-semibold text-fg">{title}</h3>
        <p className="mb-4 text-sm text-fg-2">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>确认</Button>
        </div>
      </div>
    </div>
  );
}
