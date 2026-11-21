import { ArrowRight, BookOpen, Check, Compass, ScrollText, ShieldCheck } from "lucide-react";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MILESTONES, PRINCIPLES, V1_STEPS } from "@/lib/project";

const STEP_ICONS = [Compass, ScrollText, BookOpen] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="rule-top absolute inset-x-0 top-0 -z-10 h-px" />

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="seal-mark" aria-hidden>
              易
            </span>
            <div className="leading-tight">
              <p className="font-serif text-base tracking-[0.18em]">易学研习</p>
              <p className="text-[11px] tracking-[0.22em] text-muted-foreground">YIXUE · WEB</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="页面导航">
            <a className="transition-colors hover:text-foreground" href="#flow">
              闭环流程
            </a>
            <a className="transition-colors hover:text-foreground" href="#principles">
              产品边界
            </a>
            <a className="transition-colors hover:text-foreground" href="#roadmap">
              里程碑
            </a>
          </nav>
          <Badge variant="outline" className="border-primary/30 text-primary">
            V1 · 八字
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <section className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              规则驱动 · 可追溯 · 非铁口直断
            </div>
            <h1 className="font-serif text-4xl leading-[1.25] tracking-wide text-balance sm:text-5xl lg:text-6xl">
              排盘有据，
              <br />
              断语可溯。
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              易学研习是一个面向学习者的八字排盘与解释工具。排盘由确定性代码库完成，解释只引用已收录的规则卡，
              每条断语都标注规则编号、流派、来源与置信度；知识库没有覆盖的内容，会如实显示「知识库未覆盖」。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#flow">
                  查看 V1 闭环
                  <ArrowRight aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#principles">阅读产品边界</a>
              </Button>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-border/70 pt-6">
              <div>
                <dt className="text-xs tracking-widest text-muted-foreground">排盘方式</dt>
                <dd className="mt-2 font-serif text-lg">确定性代码</dd>
              </div>
              <div>
                <dt className="text-xs tracking-widest text-muted-foreground">断语来源</dt>
                <dd className="mt-2 font-serif text-lg">规则卡编号</dd>
              </div>
              <div>
                <dt className="text-xs tracking-widest text-muted-foreground">多派结论</dt>
                <dd className="mt-2 font-serif text-lg">并列展示</dd>
              </div>
            </dl>
          </div>

          <Card className="relative overflow-hidden border-border/80 bg-card/80 shadow-[0_24px_60px_-40px_rgba(31,27,22,0.55)]">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-primary/15" />
            <div aria-hidden className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-primary/10" />
            <CardHeader className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-primary">SINGLE LOOP · V1</p>
              <CardTitle className="font-serif text-2xl">八字单点闭环</CardTitle>
              <CardDescription>输入 → 排盘 → 命中规则卡 → 可追溯报告</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {V1_STEPS.map((step, index) => {
                const Icon = STEP_ICONS[index] ?? Compass;
                return (
                  <div key={step.title} className="flex gap-4 rounded-lg border border-border/60 bg-background/60 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/5 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">0{index + 1}</span>
                        {step.title}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section id="flow" className="scroll-mt-24 border-t border-border/70 py-16">
          <SectionHeading
            eyebrow="CLOSED LOOP"
            title="四层架构，每一层都可审计"
            description="从出生信息到报告，任何一句解释都能回溯到规则卡与排盘事实，LLM 不参与排盘，也不能新增命盘事实。"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "输入层",
                body: "出生日期、时间、地点、性别与历法口径，明确时区与真太阳时选项。",
              },
              {
                title: "排盘层",
                body: "由 lunar-javascript 等确定性代码库产出四柱、十神、藏干、大运等结构化事实。",
              },
              {
                title: "规则层",
                body: "知识库规则卡命中，输出规则编号、流派、来源、适用条件与冲突组。",
              },
              {
                title: "报告层",
                body: "LLM 仅做解释与组织，输出结构化 JSON；逐条引用规则，标注置信度与冲突提示。",
              },
            ].map((item, index) => (
              <Card key={item.title} className="h-full border-border/70 bg-card/60">
                <CardHeader className="space-y-3">
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <CardTitle className="font-serif text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="principles" className="scroll-mt-24 border-t border-border/70 py-16">
          <SectionHeading
            eyebrow="BOUNDARIES"
            title="先立边界，再谈解释"
            description="易学工具最容易滑向绝对化与恐吓式表达。以下原则是硬约束，不是文案装饰。"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <Card key={principle.title} className="border-border/70 bg-card/60">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="space-y-2">
                    <CardTitle className="text-base">{principle.title}</CardTitle>
                    <CardDescription className="leading-7">{principle.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="roadmap" className="scroll-mt-24 border-t border-border/70 py-16">
          <SectionHeading
            eyebrow="ROADMAP"
            title="一次只交付一个里程碑"
            description="每个里程碑以可运行的测试为完成标准，独立提交 commit；V2 的紫微与六爻不会与八字混派硬断。"
          />
          <ol className="mt-10 space-y-3">
            {MILESTONES.map((milestone) => (
              <li
                key={milestone.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/50 p-5 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                  <span className="font-mono text-xs text-muted-foreground">{milestone.id}</span>
                  <span className="font-serif text-base">{milestone.title}</span>
                </div>
                <p className="flex-1 text-sm leading-6 text-muted-foreground">{milestone.summary}</p>
                <Badge
                  variant={milestone.status === "done" ? "default" : milestone.status === "in_progress" ? "secondary" : "outline"}
                  className="w-fit shrink-0"
                >
                  {milestone.status === "done" ? (
                    <>
                      <Check aria-hidden />
                      已完成
                    </>
                  ) : milestone.status === "in_progress" ? (
                    "进行中"
                  ) : (
                    "计划中"
                  )}
                </Badge>
              </li>
            ))}
          </ol>
        </section>

        <DisclaimerBanner />
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 text-xs leading-6 text-muted-foreground sm:px-8">
          <p>yixue-web · 易学研习工具 · V1 八字单点闭环</p>
          <p>本站内容用于传统文化学习与研究，不提供付费改运、消灾或任何形式的绝对化预测。</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="font-serif text-2xl tracking-wide sm:text-3xl">{title}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
