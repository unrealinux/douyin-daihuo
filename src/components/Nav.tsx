"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/products", label: "商品库" },
  { href: "/scripts", label: "脚本文案" },
  { href: "/assets", label: "素材排期" },
  { href: "/settings", label: "设置" },
];

function DiscIcon() {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-accent" aria-hidden>
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 14.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-2.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M12 7.5a.75.75 0 0 1 .75-.75 3 3 0 0 1 3 3 .75.75 0 1 1-1.5 0 1.5 1.5 0 0 0-1.5-1.5.75.75 0 0 1-.75-.75Z" className="fill-cyan" />
      </svg>
    </span>
  );
}

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const desktopLink = (href: string) => {
    const active = isActive(href);
    return `relative rounded-full px-3.5 py-1.5 text-sm transition-all duration-200 ease-out-expo ${
      active
        ? "bg-accent/15 font-medium text-white"
        : "text-fg-2 hover:bg-white/5 hover:text-white"
    }`;
  };

  const mobileLink = (href: string) => {
    const active = isActive(href);
    return `rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
      active ? "bg-accent/15 text-white" : "text-fg-2 hover:bg-white/5 hover:text-white"
    }`;
  };

  return (
    <nav className="sticky top-3 z-40 px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-line/60 bg-surface/80 py-1.5 pl-4 pr-1.5 shadow-card backdrop-blur-xl animate-fade-in">
        <div className="flex min-w-0 items-center gap-2.5 font-bold">
          <DiscIcon />
          <span className="truncate text-[15px] tracking-tight">抖音带货助手</span>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={desktopLink(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-2 transition-colors duration-150 hover:bg-white/5 hover:text-white md:hidden"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <span
          className="absolute bottom-0 left-4 right-4 h-px origin-left bg-gradient-to-r from-accent via-cyan to-transparent"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden
        />
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-line/60 bg-surface/95 p-2 shadow-lg backdrop-blur-xl animate-fade-in md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={mobileLink(l.href)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}