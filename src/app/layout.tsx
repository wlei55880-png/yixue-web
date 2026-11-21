import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "易学研习 · 八字 | yixue-web",
  description:
    "基于确定性排盘与可回溯规则卡的八字学习工具：每条断语标注规则编号、流派、来源、置信度与冲突提示。",
  keywords: ["八字", "排盘", "易学", "规则库", "可追溯"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
