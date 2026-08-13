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
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-accent" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 14.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-2.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 7.5a.75.75 0 0 1 .75-.75 3 3 0 0 1 3 3 .75.75 0 1 1-1.5 0 1.5 1.5 0 0 0-1.5-1.5.75.75 0 0 1-.75-.75Z" className="fill-cyan" />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = (href: string, mobile = false) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    if (mobile) {
      return `rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active ? "bg-accent/15 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
      }`;
    }
    return `border-b-2 pb-0.5 text-sm transition-colors ${
      active ? "border-accent text-white" : "border-transparent text-white/70 hover:text-white"
    }`;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 font-bold">
          <DiscIcon />
          <span className="truncate bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent">
            抖音带货助手
          </span>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/80 hover:bg-white/5 md:hidden"
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
      </div>

      {open && (
        <div className="border-t border-white/10 bg-page/95 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href, true)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
