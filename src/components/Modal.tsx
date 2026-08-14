"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[85vh] w-full overflow-auto rounded-2xl border border-line/60 bg-surface-2 shadow-lg animate-scale-in ${wide ? "max-w-xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-line/60 px-5 pt-5 pb-4">
          <h3 id="modal-title" className="text-lg font-semibold tracking-tight text-fg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-2 transition-colors duration-150 hover:bg-white/5 hover:text-fg"
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line/60 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}