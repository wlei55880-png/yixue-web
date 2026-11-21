import { BookOpen, Check, Compass, ScrollText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MILESTONES, PRINCIPLES, V1_STEPS } from "@/lib/project";

const STEP_ICONS = [Compass, ScrollText, BookOpen] as const;

const LAYERS = [
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
    body: "LLM 仅做解释与组织，逐条引用规则，标注置信度与冲突提示，不新增命盘事实。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="rule-top absolute inset-x-0 top-0 -z-10 h-px" />

      <SiteHeader current="about" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <section className="py-12 sm:py-16">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs tracking-[0.3em] text-primary">ABOUT</p>
            <h1 className="font-serif text-3xl tracking-wide sm:text-4xl">关于产品</h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              易学研习是一个面向学习者的八字排盘与解释工具。排盘由确定性代码库完成，解释只引用已收录的规则卡；多派结论并列，知识库没有覆盖的内容会如实标注。
            </p>
            <Link className="inline-block text-sm text-primary underline-offset-4 hover:underline" href="/">
              返回排盘
            </Link>
          </div>
        </section>

        <section id="flow" className="scroll-mt-24 border-t border-border/70 py-14">
          <SectionHeading
            eyebrow="CLOSED LOOP"
            title="四层架构，每一层都可审计"
            description="从出生信息到报告，任何一句解释都能回溯到规则卡与排盘事实，LLM 不参与排盘，也不能新增命盘事实。"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LAYERS.map((item, index) => (
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
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {V1_STEPS.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? Compass;
              return (
                <div key={step.title} className="flex gap-3 rounded-lg border border-border/60 bg-background/60 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/5 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="principles" className="scroll-mt-24 border-t border-border/70 py-14">
          <SectionHeading
            eyebrow="BOUNDARIES"
            title="先立边界，再谈解释"
            description="以下原则是产品硬约束：不绝对化、不恐吓、不越界，也不提供任何付费改运服务。"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
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

        <section id="roadmap" className="scroll-mt-24 border-t border-border/70 py-14">
          <SectionHeading
            eyebrow="ROADMAP"
            title="一次只交付一个里程碑"
            description="每个里程碑以可运行的测试为完成标准；V2 的紫微与六爻不会与八字混派硬断。"
          />
          <ol className="mt-8 space-y-3">
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
                  variant={
                    milestone.status === "done" ? "default" : milestone.status === "in_progress" ? "secondary" : "outline"
                  }
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

      <SiteFooter />
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
