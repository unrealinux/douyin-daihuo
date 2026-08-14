"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-line bg-white/[0.02] px-6 py-16 text-center animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line/70 bg-surface text-fg-2">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7M12 10v9M8 15l4 4 4-4" />
        </svg>
      </div>
      <p className="mt-4 text-[15px] font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-2">{description}</p>}
      {actionHref && actionLabel && (
        <div className="mt-5">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" className="text-xs" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}