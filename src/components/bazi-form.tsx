"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules } from "@/lib/engines/rules";
import { BAZI_RULES } from "@/lib/rules/bazi";
import type { ChartFacts, Gender, PillarKey } from "@/lib/schemas/chart-facts";
import type { RuleConfidence } from "@/lib/schemas/rule-card";

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
  const ruleHits = chart ? evaluateRules(chart, BAZI_RULES) : [];

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
      setError(null);
    } catch (cause) {
      setChart(null);
      setError(cause instanceof Error ? cause.message : "排盘失败，请检查输入");
    }
  }

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="gap-2">
        <CardTitle className="font-serif text-xl">快速排盘</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          输入公历出生时间，立即得到四柱、十神与藏干。时间按钟表时间计算，暂未换算真太阳时。
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PILLAR_ORDER.map((key) => {
                const pillar = chart.pillars[key];
                return (
                  <div key={key} className="rounded-lg border border-border/70 bg-background/60 p-4">
                    <p className="text-xs tracking-widest text-muted-foreground">{pillar.label}</p>
                    <p className="mt-1 font-serif text-2xl tracking-[0.2em]">{pillar.ganZhi}</p>
                    <p className="mt-2 text-xs text-muted-foreground">天干十神：{pillar.shiShenGan}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      藏干：{pillar.hideGan.join("、") || "—"}
                      {pillar.shiShenZhi.length > 0 ? `（${pillar.shiShenZhi.join("、")}）` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-lg">命理分析（规则命中）</h3>
                <span className="text-xs text-muted-foreground">{ruleHits.length} 条规则命中</span>
              </div>
              {ruleHits.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">暂无规则命中</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {ruleHits.map((hit) => (
                    <li key={hit.ruleId} className="rounded-md border border-border/60 bg-background/50 p-3">
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <details className="rounded-lg border border-border/70 bg-background/60 p-4 text-sm">
              <summary className="cursor-pointer text-muted-foreground">查看排盘 JSON</summary>
              <pre className="mt-3 overflow-x-auto text-xs leading-5">{JSON.stringify(chart, null, 2)}</pre>
            </details>
          </div>
        ) : null}
      </CardContent>
    </Card>
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
