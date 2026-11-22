import Link from "next/link";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    title: "传统排盘",
    body: "根据出生时间排出四柱、十神、藏干、十二长生、神煞、纳音、空亡与大运，结构清楚，一目了然。",
  },
  {
    title: "AI 智能解读",
    body: "把传统术语翻译成容易理解的语言，从性格、关系、事业与人生节奏等角度，给出有依据的参考。",
  },
  {
    title: "理性参考",
    body: "不制造焦虑，不作绝对化断言，不提供付费改运，也不替代医疗、法律或投资等专业意见。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="rule-top absolute inset-x-0 top-0 -z-10 h-px" />

      <SiteHeader current="about" />

      <main className="mx-auto w-full max-w-4xl px-5 pb-16 sm:px-8">
        <section className="py-14 sm:py-20">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs tracking-[0.3em] text-primary">ABOUT</p>
            <h1 className="font-serif text-3xl tracking-wide sm:text-4xl">关于易学研习</h1>
            <p className="font-serif text-base leading-8 text-foreground/90 sm:text-lg">
              易学研习是一款结合传统子平八字与现代 AI 的命理工具，为您提供有据可依的传统文化解读。
              所有内容仅供娱乐与学习参考。
            </p>
            <Link className="inline-block text-sm text-primary underline-offset-4 hover:underline" href="/">
              返回排盘
            </Link>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t border-border/70 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="h-full border-border/70 bg-card/60">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-border/70 py-12">
          <h2 className="font-serif text-2xl tracking-wide">三步开始</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { step: "一", title: "填写出生信息", body: "选择公历出生年月日、时辰与性别。" },
              { step: "二", title: "查看命盘", body: "得到四柱、五行、神煞、纳音与大运排布。" },
              { step: "三", title: "生成解读", body: "点击生成报告，阅读结合命盘的智能解读。" },
            ].map((item) => (
              <li key={item.step} className="rounded-xl border border-border/70 bg-card/50 p-5">
                <span className="seal-mark">{item.step}</span>
                <p className="mt-3 font-serif text-base">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <DisclaimerBanner />
      </main>

      <SiteFooter />
    </div>
  );
}
