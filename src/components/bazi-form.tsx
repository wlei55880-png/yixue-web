"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_CLOSING,
  REPORT_QUEUE_MESSAGE,
  REPORT_TITLE,
  type ApiErrorResponse,
  type ChartResult,
  type PublicBaziReport,
  type PublicRuleHit,
} from "@/lib/llm/report-types";
import type { Gender, PillarKey } from "@/lib/schemas/chart-facts";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

type BirthInput = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
};

type Confidence = PublicRuleHit["confidence"];

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function BaziForm() {
  const [result, setResult] = React.useState<ChartResult | null>(null);
  const [birthInput, setBirthInput] = React.useState<BirthInput | null>(null);
  const [chartPending, setChartPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<PublicBaziReport | null>(null);
  const [reportPending, setReportPending] = React.useState(false);
  const chartRequestId = React.useRef(0);
  const reportRequestId = React.useRef(0);

  const chart = result?.chart ?? null;
  const ruleHits = result?.hits ?? [];
  const ruleGroups = result?.groups ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const readNumber = (name: string, fallback: number) => {
      const raw = data.get(name);
      const value = typeof raw === "string" ? Number(raw) : Number.NaN;
      return Number.isFinite(value) ? value : fallback;
    };

    const birth: BirthInput = {
      year: readNumber("year", 1990),
      month: readNumber("month", 1),
      day: readNumber("day", 1),
      hour: readNumber("hour", 12),
      minute: readNumber("minute", 0),
      gender: data.get("gender") === "female" ? "female" : "male",
    };

    const requestId = ++chartRequestId.current;
    reportRequestId.current += 1;
    setBirthInput(birth);
    setResult(null);
    setReport(null);
    setReportPending(false);
    setError(null);
    setChartPending(true);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chart", birth }),
      });
      const payload = (await response.json().catch(() => null)) as ChartResult | ApiErrorResponse | null;
      if (requestId !== chartRequestId.current) return;

      if (!response.ok || !payload || "error" in payload) {
        setBirthInput(null);
        setError(payload && "error" in payload ? payload.error.message : "排盘失败，请稍后再试。");
        return;
      }

      setResult(payload);
    } catch {
      if (requestId !== chartRequestId.current) return;
      setBirthInput(null);
      setError("排盘失败，请检查网络后重试。");
    } finally {
      if (requestId === chartRequestId.current) setChartPending(false);
    }
  }

  async function handleGenerateReport() {
    if (!birthInput || reportPending) return;
    const requestId = ++reportRequestId.current;
    setReportPending(true);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", birth: birthInput }),
      });
      if (!response.ok) throw new Error("report request failed");

      const payload = (await response.json()) as { report?: unknown };
      if (requestId !== reportRequestId.current) return;
      setReport(isBaziReport(payload.report) ? payload.report : buildQueuedReport());
    } catch {
      if (requestId !== reportRequestId.current) return;
      setReport(buildQueuedReport());
    } finally {
      if (requestId === reportRequestId.current) setReportPending(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="gap-2">
        <CardTitle className="font-serif text-xl">快速排盘</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          输入公历出生时间，立即得到四柱、十神、藏干、十二长生与大运，并匹配知识库规则。时间按钟表时间计算，暂未换算真太阳时。
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
            <Button type="submit" disabled={chartPending}>
              {chartPending ? "排盘中…" : "排盘"}
            </Button>
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
                  {ruleGroups.map((group, groupIndex) => {
                    const [firstHit, ...rest] = group.hits;
                    if (!firstHit) return null;
                    if (rest.length === 0) {
                      return <RuleHitCard key={`${group.label}-${groupIndex}`} hit={firstHit} />;
                    }
                    return (
                      <div
                        key={`${group.label}-${groupIndex}`}
                        className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            冲突组：{group.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{group.hits.length} 条并列</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          同组规则可能给出不同判断，以下逐条展示，保留分歧，不做单一裁决。
                        </p>
                        <ul className="mt-2 space-y-2">
                          {group.hits.map((hit, hitIndex) => (
                            <li key={`${hit.name}-${hitIndex}`}>
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
            <div id="ai-report" className="rounded-lg border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg">AI 智能解读报告</h3>
                  <p className="text-xs leading-6 text-muted-foreground">
                    融合子平格局、盲派象法与荣格心理学，按三篇结构展开：原局剖析、岁运推演、宗师寄语。
                  </p>
                </div>
                {report ? (
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateReport} disabled={reportPending}>
                    {reportPending ? "推演中…" : "重新生成"}
                  </Button>
                ) : null}
              </div>
              {report ? (
                <div aria-live="polite" className="mt-4 space-y-3">
                  <ReportMarkdown markdown={report.markdown} />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <Button type="button" onClick={handleGenerateReport} disabled={reportPending}>
                    {reportPending ? "正在推演…" : "生成报告"}
                  </Button>
                  <p className="text-xs leading-6 text-muted-foreground">
                    报告会结合上方命理分析，冲突处并列保留，不给出绝对化结论。
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

function isBaziReport(value: unknown): value is PublicBaziReport {
  return typeof value === "object" && value !== null && typeof (value as { markdown?: unknown }).markdown === "string";
}

function buildQueuedReport(): PublicBaziReport {
  const markdown = `${REPORT_QUEUE_MESSAGE}\n\n${REPORT_CLOSING}`;
  return {
    provider: "unavailable",
    model: "llm",
    title: REPORT_TITLE,
    markdown,
    text: markdown,
    safetyReplacements: [],
  };
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

function RuleHitCard({ hit }: { hit: PublicRuleHit }) {
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
        命理依据：{hit.basis}
        {hit.basisNote ? ` · ${hit.basisNote}` : ""}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {hit.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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
