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
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-2">{description}</p>}
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
    <div className="col-span-full rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <p className="text-fg-2">{title}</p>
      {description && <p className="mt-1 text-sm text-white/40">{description}</p>}
      {actionHref && actionLabel && (
        <div className="mt-4">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" className="text-xs" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}
