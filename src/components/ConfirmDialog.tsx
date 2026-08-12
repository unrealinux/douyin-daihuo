"use client";

import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div className="w-80 rounded-lg border border-white/10 bg-surface p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-semibold text-fg">{title}</h3>
        <p className="mb-4 text-sm text-white/60">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>确认</Button>
        </div>
      </div>
    </div>
  );
}
