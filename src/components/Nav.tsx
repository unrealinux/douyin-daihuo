"use client";

import Link from "next/link";
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
      <path d="M12 7.5a.75.75 0 0 1 .75-.75 3 3 0 0 1 3 3 .75.75 0 1 1-1.5 0 1.5 1.5 0 0 0-1.5-1.5.75.75 0 0 1-.75-.75Z" fill="#22d3ee" />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <div className="flex items-center gap-2 font-bold">
          <DiscIcon />
          <span className="bg-gradient-to-r from-[#fe2c55] to-[#22d3ee] bg-clip-text text-transparent">抖音带货助手</span>
        </div>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 pb-0.5 text-sm transition-colors ${
                active ? "border-accent text-white" : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
