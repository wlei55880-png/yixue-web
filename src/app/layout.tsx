import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "易学研习 · 八字排盘与 AI 解读",
  description:
    "易学研习是一款结合传统子平八字与现代 AI 的命理工具，为您提供有据可依的传统文化解读。所有内容仅供娱乐与学习参考。",
  keywords: ["八字", "排盘", "命理", "传统文化", "AI 解读"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
