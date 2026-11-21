import Link from "next/link";

import { Badge } from "@/components/ui/badge";

export function SiteHeader({ current }: { current: "home" | "about" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="seal-mark" aria-hidden>
            易
          </span>
          <div className="leading-tight">
            <p className="font-serif text-base tracking-[0.18em]">易学研习</p>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground">YIXUE · WEB</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground sm:gap-7 sm:text-sm" aria-label="页面导航">
          {current === "home" ? (
            <>
              <a className="transition-colors hover:text-foreground" href="#paipan">
                快速排盘
              </a>
              <Link className="transition-colors hover:text-foreground" href="/about">
                关于产品
              </Link>
            </>
          ) : (
            <>
              <Link className="transition-colors hover:text-foreground" href="/">
                快速排盘
              </Link>
              <a className="transition-colors hover:text-foreground" href="#principles">
                产品边界
              </a>
              <a className="transition-colors hover:text-foreground" href="#roadmap">
                里程碑
              </a>
            </>
          )}
        </nav>
        <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
          V1 · 八字
        </Badge>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-6">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <p className="text-xs leading-6 text-muted-foreground">
          命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。
        </p>
      </div>
    </footer>
  );
}
