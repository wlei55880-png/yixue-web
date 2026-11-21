"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules, groupRuleHits } from "@/lib/engines/rules";
import { generateBaziReport, REPORT_CLOSING, type BaziReport } from "@/lib/llm/gateway";
import { BAZI_RULES, CONFLICT_GROUP_LABELS } from "@/lib/rules/bazi";
import type { ChartFacts, Gender, PillarKey } from "@/lib/schemas/chart-facts";
import type { RuleConfidence, RuleHit } from "@/lib/schemas/rule-card";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

const CONFIDENCE_LABELS: Record<RuleConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function BaziForm() {
  const [chart, setChart] = React.useState<ChartFacts | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<BaziReport | null>(null);
  const ruleHits = chart ? evaluateRules(chart, BAZI_RULES) : [];
  const ruleGroups = groupRuleHits(ruleHits);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const readNumber = (name: string, fallback: number) => {
      const raw = data.get(name);
      const value = typeof raw === "string" ? Number(raw) : Number.NaN;
      return Number.isFinite(value) ? value : fallback;
    };

    try {
      const result = getBaziChart({
        year: readNumber("year", 1990),
        month: readNumber("month", 1),
        day: readNumber("day", 1),
        hour: readNumber("hour", 12),
        minute: readNumber("minute", 0),
        gender: (data.get("gender") === "female" ? "female" : "male") as Gender,
      });
      setChart(result);
      setReport(null);
      setError(null);
    } catch (cause) {
      setChart(null);
      setReport(null);
      setError(cause instanceof Error ? cause.message : "排盘失败，请检查输入");
    }
  }

  function handleGenerateReport() {
    if (!chart) return;
    setReport(generateBaziReport({ chart, hits: ruleHits }));
  }

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="gap-2">
        <CardTitle className="font-serif text-xl">快速排盘</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          输入公历出生时间，立即得到四柱、十神、藏干、十二长生与大运，并匹配本地规则库。时间按钟表时间计算，暂未换算真太阳时。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="年">
            <input className={inputClassName} name="year" type="number" min={1900} max={2100} defaultValue={1990} required />
          </Field>
          <Field label="月">
            <input className={inputClassName} name="month" type="number" min={1} max={12} defaultValue={1} required />
          </Field>
          <Field label="日">
            <input className={inputClassName} name="day" type="number" min={1} max={31} defaultValue={1} required />
          </Field>
          <Field label="时">
            <input className={inputClassName} name="hour" type="number" min={0} max={23} defaultValue={12} required />
          </Field>
          <Field label="分">
            <input className={inputClassName} name="minute" type="number" min={0} max={59} defaultValue={0} required />
          </Field>
          <Field label="性别">
            <select className={inputClassName} name="gender" defaultValue="male">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-6">
            <Button type="submit">排盘</Button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {chart ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              公历 {chart.solar.text} · 农历 {chart.lunar.text} · {chart.genderLabel} · 日主 {chart.dayMaster}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              {PILLAR_ORDER.map((key) => {
                const pillar = chart.pillars[key];
                return (
                  <div key={key} className="rounded-lg border border-border/70 bg-background/60 p-3 sm:p-4">
                    <p className="text-xs tracking-widest text-muted-foreground">{pillar.label}</p>
                    <p className="mt-1 font-serif text-2xl tracking-[0.15em] sm:tracking-[0.2em]">{pillar.ganZhi}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      天干十神：<span className="text-foreground">{pillar.shiShenGan}</span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      地支藏干：
                      <span className="text-foreground">
                        {pillar.hideGan.length > 0
                          ? pillar.hideGan
                              .map((gan, index) => `${gan}（${pillar.shiShenZhi[index] ?? "—"}）`)
                              .join("、")
                          : "—"}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-lg">命理分析（规则命中）</h3>
                <span className="text-xs text-muted-foreground">
                  {ruleHits.length === 0 ? "未命中" : `${ruleHits.length} 条规则命中`}
                </span>
              </div>
              {ruleHits.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">当前排盘未命中知识库规则</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {ruleGroups.map((group) => {
                    const [firstHit, ...rest] = group.hits;
                    if (!firstHit) return null;
                    if (rest.length === 0) {
                      return <RuleHitCard key={group.conflictGroup} hit={firstHit} />;
                    }
                    return (
                      <div
                        key={group.conflictGroup}
                        className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            冲突组：{CONFLICT_GROUP_LABELS[group.conflictGroup] ?? group.conflictGroup}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{group.hits.length} 条并列</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          同组规则可能给出不同判断，以下逐条展示，保留分歧，不做单一裁决。
                        </p>
                        <ul className="mt-2 space-y-2">
                          {group.hits.map((hit) => (
                            <li key={hit.ruleId}>
                              <RuleHitCard hit={hit} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <details className="rounded-lg border border-border/70 bg-background/60 p-4 text-sm">
              <summary className="cursor-pointer text-muted-foreground">查看排盘 JSON</summary>
              <pre className="mt-3 overflow-x-auto text-xs leading-5">{JSON.stringify(chart, null, 2)}</pre>
            </details>
            <div id="ai-report" className="rounded-lg border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg">AI 智能解读报告</h3>
                  <p className="text-xs leading-6 text-muted-foreground">
                    宗师视角：子平格局 + 盲派象法 + 荣格心理，三篇结构。由本地模板引擎基于排盘事实与命中规则生成，暂不调用外部模型。
                  </p>
                </div>
                {report ? (
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateReport}>
                    重新生成
                  </Button>
                ) : null}
              </div>
              {report ? (
                <div aria-live="polite" className="mt-4 space-y-3">
                  <ReportMarkdown markdown={report.markdown} />
                  <p className="text-[11px] text-muted-foreground/80">
                    引用规则 {report.ruleIds.length} 条 · 生成方式：本地模板（{report.model}）
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <Button type="button" onClick={handleGenerateReport}>
                    生成报告
                  </Button>
                  <p className="text-xs leading-6 text-muted-foreground">
                    报告会引用上方命中的规则编号，冲突处并列保留，不给出绝对化结论。
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReportMarkdown({ markdown }: { markdown: string }) {
  return (
    <>
      {markdown.split("\n").map((line, index) => {
        const key = `${index}-${line.slice(0, 12)}`;
        if (line.startsWith("# ")) {
          return (
            <h4 key={key} className="border-b border-primary/20 pb-2 pt-3 font-serif text-xl tracking-wide">
              {line.slice(2)}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h5 key={key} className="pt-1 font-serif text-base">
              {line.slice(3)}
            </h5>
          );
        }
        if (line === REPORT_CLOSING) {
          return (
            <p key={key} className="border-t border-border/60 pt-3 text-xs leading-6 text-muted-foreground">
              {line}
            </p>
          );
        }
        if (line.trim() === "") return null;
        return (
          <p key={key} className="indent-8 font-serif text-[15px] leading-8 text-foreground/90 sm:text-base">
            {line}
          </p>
        );
      })}
    </>
  );
}

function RuleHitCard({ hit }: { hit: RuleHit }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{hit.name}</span>
        <span className="rounded border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {hit.school}
        </span>
        <span className="rounded border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
          置信度：{CONFIDENCE_LABELS[hit.confidence]}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        来源：{hit.source.work}
        {hit.source.note ? ` · ${hit.source.note}` : ""}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {hit.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground/80">规则编号：{hit.ruleId}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
