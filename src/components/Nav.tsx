import Link from "next/link";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/products", label: "商品库" },
  { href: "/scripts", label: "脚本文案" },
  { href: "/assets", label: "素材排期" },
  { href: "/settings", label: "设置" },
];

export default function Nav() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <span className="font-bold text-accent">抖音带货助手</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm hover:text-accent">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
