"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ganElement, zhiElement } from "@/lib/domain/wuxing";
import {
  REPORT_CLOSING,
  REPORT_QUEUE_MESSAGE,
  REPORT_TITLE,
  type ApiErrorResponse,
  type ChartResult,
  type PublicBaziReport,
  type PublicRuleHit,
} from "@/lib/llm/report-types";
import type { ChartFacts, Element, Gender, PillarKey } from "@/lib/schemas/chart-facts";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

/** 深色黑金表盘的五行配色。 */
const ELEMENT_TEXT: Record<Element, string> = {
  木: "text-emerald-300",
  火: "text-rose-300",
  土: "text-amber-300",
  金: "text-zinc-200",
  水: "text-sky-300",
};

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
          输入公历出生时间，立即得到四柱、十神、藏干、十二长生、神煞、纳音、空亡与大运，并匹配知识库规则。时间按钟表时间计算，暂未换算真太阳时。
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
              公历 {chart.solar.text} · 农历 {chart.lunar.text} · {chart.genderLabel} · 日主{" "}
              <span className={ELEMENT_TEXT[ganElement(chart.dayMaster)]}>{chart.dayMaster}</span>
            </p>
            <PillarTable chart={chart} />
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
    <div className="space-y-3">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h4 className="border-b border-primary/20 pb-2 pt-3 font-serif text-xl tracking-wide">{children}</h4>
          ),
          h2: ({ children }) => <h5 className="pt-1 font-serif text-base">{children}</h5>,
          h3: ({ children }) => (
            <h6 className="pt-1 font-serif text-sm tracking-wide text-primary/90">{children}</h6>
          ),
          p: ({ children }) =>
            typeof children === "string" && children.trim() === REPORT_CLOSING ? (
              <p className="border-t border-border/60 pt-3 text-xs leading-6 text-muted-foreground">{children}</p>
            ) : (
              <p className="indent-8 font-serif text-[15px] leading-8 text-foreground/90 sm:text-base">{children}</p>
            ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-6 font-serif text-[15px] leading-7 text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-6 font-serif text-[15px] leading-7 text-foreground/90">
              {children}
            </ol>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function PillarCell({ children, day }: { children: React.ReactNode; day: boolean }) {
  return <td className={`min-w-0 px-1 py-2 align-middle sm:px-2 ${day ? "bg-amber-500/[0.05]" : ""}`}>{children}</td>;
}

function PillarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <th
        scope="row"
        className="bg-amber-500/[0.03] px-1 py-2 text-[10px] font-normal tracking-widest text-amber-500/60 sm:text-[11px]"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}

/** 深色黑金四柱表：天干、地支、十神、藏干、星运行、神煞。 */
function PillarTable({ chart }: { chart: ChartFacts }) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-[#131009] shadow-[0_22px_48px_-32px_rgba(0,0,0,0.9)]">
      <table className="w-full table-fixed border-collapse text-center">
        <colgroup>
          <col className="w-10 sm:w-16" />
          <col span={4} />
        </colgroup>
        <thead>
          <tr className="border-b border-amber-500/25 bg-amber-500/[0.06]">
            <th className="px-1 py-2 text-[10px] font-normal tracking-[0.2em] text-amber-500/60" scope="col">
              四柱
            </th>
            {PILLAR_ORDER.map((key) => (
              <th key={key} scope="col" className="px-1 py-2 font-normal">
                <span
                  className={`font-serif text-sm tracking-[0.15em] sm:text-base ${
                    key === "day" ? "text-amber-300" : "text-amber-100/75"
                  }`}
                >
                  {chart.pillars[key].label}
                </span>
                {key === "day" ? <span className="ml-1 text-[9px] text-amber-500/70">日主</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-500/15">
          <PillarRow label="天干">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <PillarCell key={key} day={key === "day"}>
                  <span
                    className={`font-serif text-2xl tracking-widest sm:text-3xl ${ELEMENT_TEXT[ganElement(pillar.gan)]}`}
                  >
                    {pillar.gan}
                  </span>
                </PillarCell>
              );
            })}
          </PillarRow>
          <PillarRow label="地支">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <PillarCell key={key} day={key === "day"}>
                  <span
                    className={`font-serif text-2xl tracking-widest sm:text-3xl ${ELEMENT_TEXT[zhiElement(pillar.zhi)]}`}
                  >
                    {pillar.zhi}
                  </span>
                </PillarCell>
              );
            })}
          </PillarRow>
          <PillarRow label="十神">
            {PILLAR_ORDER.map((key) => (
              <PillarCell key={key} day={key === "day"}>
                <span className="text-[10px] text-zinc-400 sm:text-xs">{chart.pillars[key].shiShenGan}</span>
              </PillarCell>
            ))}
          </PillarRow>
          <PillarRow label="藏干">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <PillarCell key={key} day={key === "day"}>
                  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[10px] leading-4 text-zinc-500">
                    {pillar.hideGan.map((gan, index) => (
                      <span key={`${gan}-${index}`} className="whitespace-nowrap">
                        <span className={ELEMENT_TEXT[ganElement(gan)]}>{gan}</span>
                        <span className="ml-0.5">{pillar.shiShenZhi[index] ?? ""}</span>
                      </span>
                    ))}
                  </div>
                </PillarCell>
              );
            })}
          </PillarRow>
          <PillarRow label="星运行">
            {PILLAR_ORDER.map((key) => (
              <PillarCell key={key} day={key === "day"}>
                <span className="text-[11px] font-medium text-amber-200/90 sm:text-xs">
                  {chart.pillars[key].diShi}
                </span>
              </PillarCell>
            ))}
          </PillarRow>
          <PillarRow label="神煞">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <PillarCell key={key} day={key === "day"}>
                  {pillar.shenSha.length === 0 ? (
                    <span className="text-[10px] text-zinc-600">—</span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
                      {pillar.shenSha.map((item) => (
                        <span
                          key={item.name}
                          title={`${item.name} · ${item.basedOn}`}
                          className={`text-[9px] leading-3 sm:text-[10px] ${ELEMENT_TEXT[item.element]}`}
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </PillarCell>
              );
            })}
          </PillarRow>
        </tbody>
      </table>
      <div className="grid gap-px border-t border-amber-500/25 bg-amber-500/15 sm:grid-cols-2">
        <div className="bg-[#131009] px-3 py-2.5">
          <p className="text-[10px] tracking-[0.2em] text-amber-500/60">纳音</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <span key={key} className="whitespace-nowrap">
                  <span className="text-zinc-500">{pillar.label}</span>
                  <span className={`ml-1 ${ELEMENT_TEXT[pillar.naYin.element]}`}>{pillar.naYin.name}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="bg-[#131009] px-3 py-2.5">
          <p className="text-[10px] tracking-[0.2em] text-amber-500/60">空亡</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            日柱旬空 <span className="text-amber-300">{chart.kongWang.day.branches.join("")}</span>
            <span className="mx-2 text-amber-500/30">|</span>
            年柱旬空 <span className="text-amber-300">{chart.kongWang.year.branches.join("")}</span>
          </p>
        </div>
      </div>
    </div>
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
