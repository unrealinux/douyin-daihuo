import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = { title: "抖音带货助手" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <ToastProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6 pb-16 md:py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}