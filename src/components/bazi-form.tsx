"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentMonthIndex, liuYueOf, yearGanZhi } from "@/lib/domain/liuyue";
import { shenShaForBranch, type ShenShaBaseInfo, type ShenShaHit } from "@/lib/domain/shensha";
import { ganElement, shiShenOf, zhiElement } from "@/lib/domain/wuxing";
import {
  REPORT_CLOSING,
  REPORT_QUEUE_MESSAGE,
  REPORT_TITLE,
  type ApiErrorResponse,
  type ChartResult,
  type PublicBaziReport,
  type PublicRuleHit,
} from "@/lib/llm/report-types";
import type { ChartFacts, Element, Gan, Gender, PillarKey, Zhi } from "@/lib/schemas/chart-facts";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

const YEARS = Array.from({ length: 201 }, (_, index) => 1900 + index);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const SHI_CHEN = [
  { value: 0, label: "子时 · 00:00" },
  { value: 2, label: "丑时 · 02:00" },
  { value: 4, label: "寅时 · 04:00" },
  { value: 6, label: "卯时 · 06:00" },
  { value: 8, label: "辰时 · 08:00" },
  { value: 10, label: "巳时 · 10:00" },
  { value: 12, label: "午时 · 12:00" },
  { value: 14, label: "未时 · 14:00" },
  { value: 16, label: "申时 · 16:00" },
  { value: 18, label: "酉时 · 18:00" },
  { value: 20, label: "戌时 · 20:00" },
  { value: 22, label: "亥时 · 22:00" },
] as const;

/** 深色黑金表盘的五行配色。 */
const ELEMENT_TEXT: Record<Element, string> = {
  木: "text-emerald-300",
  火: "text-rose-300",
  土: "text-amber-300",
  金: "text-zinc-200",
  水: "text-sky-300",
};

/** 从命盘提取神煞匹配基准，供流年、流月复用。 */
function shenShaBaseOf(chart: ChartFacts): ShenShaBaseInfo {
  return {
    dayGan: chart.dayMaster,
    yearGan: chart.pillars.year.gan,
    dayZhi: chart.pillars.day.zhi,
    yearZhi: chart.pillars.year.zhi,
    dayXunKong: chart.kongWang.day.branches,
  };
}

/** 流年、流月卡片上的神煞悬浮说明。 */
function shenShaTitle(hits: ShenShaHit[]): string {
  if (hits.length === 0) return "神煞：无";
  return `神煞：${hits.map((hit) => `${hit.name}（${hit.basedOn}）`).join("、")}`;
}


/** 十神名词解释，鼠标悬停时通过 title 展示。 */
const SHI_SHEN_TIPS: Record<string, string> = {
  日主: "日主：代表命主自身，是八字解读的核心参照。",
  比肩: "比肩：代表自我、同辈与独立意识，也主竞争与朋友缘分。",
  劫财: "劫财：代表行动力与社交竞争，主合作中的分利与取舍。",
  食神: "食神：代表享受、表达与温和的创造力，主福气与口福。",
  伤官: "伤官：代表才华外露、创新求异，也主锋芒与不服管束。",
  偏财: "偏财：代表流动之财、机会与人脉，主慷慨与经营手腕。",
  正财: "正财：代表稳定收入、务实与责任感，主勤俭与家庭观念。",
  七杀: "七杀：代表压力、魄力与危机意识，主竞争与突破。",
  正官: "正官：代表规则、责任与名誉，主自律与职位缘分。",
  偏印: "偏印：代表独特思维、灵感与学习力，也主孤僻与多思。",
  正印: "正印：代表庇护、学识与长辈缘，主仁慈与稳定。",
};

/** 神煞名词解释。 */
const SHEN_SHA_TIPS: Record<string, string> = {
  天乙贵人: "天乙贵人：主聪明智慧，遇难呈祥，易得贵人相助。",
  太极贵人: "太极贵人：主悟性高、喜玄学哲理，做事有始有终。",
  文昌贵人: "文昌贵人：主聪慧好学、文思敏捷，利于考试与文书。",
  国印贵人: "国印贵人：主诚实守信、有掌印之权，利于公职与管理。",
  禄神: "禄神：主衣食丰足、身体康健，也代表稳定收入。",
  羊刃: "羊刃：主刚强果断、行动力强，也需防急躁与冲动。",
  桃花: "桃花：主人缘与异性缘佳，主魅力、审美与情感互动。",
  驿马: "驿马：主走动、出行与迁移，利于外地发展与变化。",
  华盖: "华盖：主孤高聪慧、喜艺术宗教，常有独处之思。",
  将星: "将星：主领导力与组织才能，易得权柄与众人拥护。",
  劫煞: "劫煞：主竞争与突发变动，宜谨慎理财、防意外波动。",
  灾煞: "灾煞：主意外阻碍与情绪起伏，行事宜稳、注意安全。",
  亡神: "亡神：主心思深沉、机变多谋，也需防多虑与失落。",
  孤辰: "孤辰：主性格独立、喜静，情感上易有独处倾向。",
  寡宿: "寡宿：主内敛自守、重精神世界，宜主动经营关系。",
  红鸾: "红鸾：主喜事、姻缘与桃花喜庆，人缘亲和。",
  天喜: "天喜：主喜庆、婚姻与添丁之喜，心境开朗。",
  空亡: "空亡：主该柱力量虚浮或另有转向，需结合全局判断。",
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

export function BaziForm() {
  const [result, setResult] = React.useState<ChartResult | null>(null);
  const [birthInput, setBirthInput] = React.useState<BirthInput | null>(null);
  const [chartPending, setChartPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<PublicBaziReport | null>(null);
  const [reportPending, setReportPending] = React.useState(false);
  const [focusLiuYue, setFocusLiuYue] = React.useState<{ year: number; monthIndex: number } | null>(null);
  const chartRequestId = React.useRef(0);
  const reportRequestId = React.useRef(0);
  const [year, setYear] = React.useState(1990);
  const [month, setMonth] = React.useState(1);
  const [day, setDay] = React.useState(1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);

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
    setFocusLiuYue(null);
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
        body: JSON.stringify({
          action: "report",
          birth: birthInput,
          ...(focusLiuYue ? { focusLiuYue } : {}),
        }),
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
        <form onSubmit={handleSubmit} className="rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SelectField
              label="年"
              name="year"
              value={year}
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                setYear(nextYear);
                setDay((current) => Math.min(current, new Date(nextYear, month, 0).getDate()));
              }}
            >
              {YEARS.map((item) => (
                <option key={item} value={item}>
                  {item} 年
                </option>
              ))}
            </SelectField>
            <SelectField
              label="月"
              name="month"
              value={month}
              onChange={(event) => {
                const nextMonth = Number(event.target.value);
                setMonth(nextMonth);
                setDay((current) => Math.min(current, new Date(year, nextMonth, 0).getDate()));
              }}
            >
              {MONTHS.map((item) => (
                <option key={item} value={item}>
                  {item} 月
                </option>
              ))}
            </SelectField>
            <SelectField
              label="日"
              name="day"
              value={safeDay}
              onChange={(event) => setDay(Number(event.target.value))}
            >
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((item) => (
                <option key={item} value={item}>
                  {item} 日
                </option>
              ))}
            </SelectField>
            <SelectField label="时辰" name="hour" defaultValue={12}>
              {SHI_CHEN.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="分" name="minute" defaultValue={0}>
              {MINUTES.map((item) => (
                <option key={item} value={item}>
                  {item} 分
                </option>
              ))}
            </SelectField>
            <SelectField label="性别" name="gender" defaultValue="male">
              <option value="male">男</option>
              <option value="female">女</option>
            </SelectField>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <p className="text-xs text-muted-foreground">公历 · 北京时间</p>
            <Button type="submit" disabled={chartPending} className="min-w-28">
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
            <ChartInteractive
              key={`${chart.solar.text}-${chart.input.gender}`}
              chart={chart}
              onFocusChange={setFocusLiuYue}
            />
            <details className="group rounded-lg border border-border/70 bg-background/60">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
                <h3 className="font-serif text-lg">排盘规则溯源</h3>
                <span className="text-xs text-muted-foreground">
                  {ruleHits.length === 0 ? "未命中" : `${ruleHits.length} 条规则命中`} ·{" "}
                  <span className="group-open:hidden">展开</span>
                  <span className="hidden group-open:inline">收起</span>
                </span>
              </summary>
              <div className="border-t border-border/60 p-4">
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
            </details>
            <div id="ai-report" className="rounded-lg border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-serif text-lg">AI 智能解读</h3>
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
                <div className="mt-4">
                  <Button type="button" onClick={handleGenerateReport} disabled={reportPending}>
                    {reportPending ? "正在推演…" : "生成报告"}
                  </Button>
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
            {PILLAR_ORDER.map((key) => {
              const shiShen = chart.pillars[key].shiShenGan;
              return (
                <PillarCell key={key} day={key === "day"}>
                  <span
                    title={SHI_SHEN_TIPS[shiShen] ?? shiShen}
                    className="cursor-help text-[10px] text-zinc-400 underline decoration-zinc-600/60 decoration-dotted underline-offset-2 transition-colors hover:text-amber-200 sm:text-xs"
                  >
                    {shiShen}
                  </span>
                </PillarCell>
              );
            })}
          </PillarRow>
          <PillarRow label="藏干">
            {PILLAR_ORDER.map((key) => {
              const pillar = chart.pillars[key];
              return (
                <PillarCell key={key} day={key === "day"}>
                  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[10px] leading-4 text-zinc-500">
                    {pillar.hideGan.map((gan, index) => {
                      const shiShen = pillar.shiShenZhi[index] ?? "";
                      return (
                        <span
                          key={`${gan}-${index}`}
                          title={SHI_SHEN_TIPS[shiShen] ?? shiShen}
                          className="cursor-help whitespace-nowrap transition-colors hover:text-amber-200"
                        >
                          <span className={ELEMENT_TEXT[ganElement(gan)]}>{gan}</span>
                          <span className="ml-0.5">{shiShen}</span>
                        </span>
                      );
                    })}
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
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {pillar.shenSha.map((item) => (
                        <span
                          key={item.name}
                          title={`${SHEN_SHA_TIPS[item.name] ?? item.name}（依据：${item.basedOn}）`}
                          className={`cursor-help whitespace-nowrap rounded border border-amber-500/15 bg-white/[0.03] px-1 py-0.5 text-[10px] leading-3 transition-colors hover:bg-white/[0.08] sm:text-[11px] ${ELEMENT_TEXT[item.element]}`}
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

/** 排盘交互容器：统一管理大运、流年、流月选择，驱动流月与关系图联动。 */
function ChartInteractive({
  chart,
  onFocusChange,
}: {
  chart: ChartFacts;
  onFocusChange: (focus: { year: number; monthIndex: number }) => void;
}) {
  const currentYear = new Date().getFullYear();
  const daYun = chart.luck.daYun.slice(0, 8);
  const initialIndex = daYun.findIndex((item) => currentYear >= item.startYear && currentYear <= item.endYear);
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex >= 0 ? initialIndex : 0);
  const [selectedYear, setSelectedYear] = React.useState(() => {
    const initial = daYun[initialIndex >= 0 ? initialIndex : 0];
    if (initial && currentYear >= initial.startYear && currentYear <= initial.endYear) return currentYear;
    return initial?.startYear ?? currentYear;
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState(() =>
    selectedYear === currentYear ? currentMonthIndex() : 0,
  );

  React.useEffect(() => {
    onFocusChange({ year: selectedYear, monthIndex: selectedMonthIndex });
  }, [onFocusChange, selectedMonthIndex, selectedYear]);

  function selectDaYun(index: number) {
    setSelectedIndex(index);
    const target = daYun[index];
    if (!target) return;
    const nextYear = currentYear >= target.startYear && currentYear <= target.endYear ? currentYear : target.startYear;
    setSelectedYear(nextYear);
    setSelectedMonthIndex(nextYear === currentYear ? currentMonthIndex() : 0);
  }

  function selectYear(year: number) {
    setSelectedYear(year);
    setSelectedMonthIndex(year === currentYear ? currentMonthIndex() : 0);
  }

  return (
    <div className="space-y-4">
      <PillarTable chart={chart} />
      <DaYunStrip
        chart={chart}
        daYun={daYun}
        selectedIndex={selectedIndex}
        onSelectIndex={selectDaYun}
        selectedYear={selectedYear}
        onSelectYear={selectYear}
        selectedMonthIndex={selectedMonthIndex}
        onSelectMonth={setSelectedMonthIndex}
      />
      <RelationDiagram chart={chart} flowYear={selectedYear} flowMonthIndex={selectedMonthIndex} />
    </div>
  );
}

interface DaYunStripProps {
  chart: ChartFacts;
  daYun: ChartFacts["luck"]["daYun"];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
}

/** 横向 8 步大运；点击大运切换流年，点击流年展开十二流月，点击流月联动图示。 */
function DaYunStrip({
  chart,
  daYun,
  selectedIndex,
  onSelectIndex,
  selectedYear,
  onSelectYear,
  selectedMonthIndex,
  onSelectMonth,
}: DaYunStripProps) {
  const currentYear = new Date().getFullYear();
  const selected = daYun[selectedIndex] ?? daYun[0];
  if (!selected) return null;

  const years = Array.from(
    { length: selected.endYear - selected.startYear + 1 },
    (_, index) => selected.startYear + index,
  );
  const flow = yearGanZhi(selectedYear);
  const months = liuYueOf(flow.gan);
  const activeMonth = currentMonthIndex();
  const shenShaBase = shenShaBaseOf(chart);

  return (
    <div className="rounded-xl border border-amber-500/25 bg-[#131009] p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h3 className="font-serif text-base text-amber-100/90">大运排布 · 八步</h3>
        <p className="text-[11px] text-amber-500/60">
          起运 {chart.luck.startSolar.slice(0, 10)} · {chart.luck.forward ? "顺排" : "逆排"}
        </p>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {daYun.map((item, index) => {
          const active = currentYear >= item.startYear && currentYear <= item.endYear;
          const currentAge = item.startAge + (currentYear - item.startYear);
          const isSelected = selectedIndex === index;
          return (
            <button
              key={item.index}
              type="button"
              onClick={() => onSelectIndex(index)}
              aria-pressed={isSelected}
              title={`查看 ${item.ganZhi} 大运的流年`}
              className={`min-w-[5.6rem] flex-1 cursor-pointer rounded-lg border px-2 py-2.5 text-center transition-colors ${
                isSelected
                  ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/30"
                  : "border-amber-500/15 bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/[0.06]"
              }`}
            >
              <p className={`font-serif text-lg tracking-widest ${isSelected ? "text-amber-200" : "text-zinc-200"}`}>
                {item.ganZhi}
              </p>
              <p className="mt-1 whitespace-nowrap text-[10px] text-zinc-500">
                {item.startYear}–{item.endYear}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[10px] text-zinc-400">
                {item.startAge}–{item.endAge} 岁
              </p>
              <p className="mt-1 whitespace-nowrap text-[10px]">
                {active ? (
                  <span className="text-amber-300">当前 {currentAge} 岁</span>
                ) : isSelected ? (
                  <span className="text-amber-500/70">查看中</span>
                ) : (
                  <span className="text-transparent">·</span>
                )}
              </p>
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg border border-amber-500/15 bg-black/25 p-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-1 px-1">
          <p className="text-[10px] tracking-[0.2em] text-amber-500/60">流年 · {selected.ganZhi} 大运</p>
          <p className="text-[10px] text-zinc-500">
            {selected.startYear}–{selected.endYear} · {selected.startAge}–{selected.endAge} 岁
          </p>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {years.map((year) => {
            const gz = yearGanZhi(year);
            const shiShen = shiShenOf(chart.dayMaster, gz.gan);
            const hits = shenShaForBranch(shenShaBase, gz.zhi);
            const isCurrent = year === currentYear;
            const isSelected = year === selectedYear;
            return (
              <button
                key={year}
                type="button"
                onClick={() => onSelectYear(year)}
                aria-pressed={isSelected}
                title={`${year} ${gz.text} · 十神：${shiShen}\n${SHI_SHEN_TIPS[shiShen] ?? ""}\n${shenShaTitle(hits)}`}
                className={`min-w-[3.4rem] flex-1 cursor-pointer rounded-md border px-1 py-1.5 text-center transition-colors ${
                  isSelected
                    ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/25"
                    : "border-amber-500/10 bg-white/[0.02] hover:border-amber-400/40 hover:bg-amber-500/[0.06]"
                }`}
              >
                <p className={`text-[10px] ${isSelected ? "text-amber-300" : isCurrent ? "text-amber-400/80" : "text-zinc-500"}`}>
                  {year}
                  {isCurrent ? <span className="ml-0.5 text-amber-400">今</span> : null}
                </p>
                <p
                  className={`font-serif text-sm tracking-widest ${
                    isSelected ? "text-amber-200" : isCurrent ? "text-amber-200/90" : "text-zinc-300"
                  }`}
                >
                  {gz.text}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[9px] leading-3 text-zinc-500">{shiShen}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-amber-500/15 bg-black/25 p-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-1 px-1">
          <p className="text-[10px] tracking-[0.2em] text-amber-500/60">
            流月 · {selectedYear} {flow.text}
          </p>
          <p className="text-[10px] text-zinc-500">点击流年切换 · 点击流月联动右侧图示</p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
          {months.map((month, index) => {
            const shiShen = shiShenOf(chart.dayMaster, month.gan);
            const hits = shenShaForBranch(shenShaBase, month.zhi);
            const isCurrent = selectedYear === currentYear && index === activeMonth;
            const isSelected = index === selectedMonthIndex;
            return (
              <button
                key={`${selectedYear}-${month.label}`}
                type="button"
                onClick={() => onSelectMonth(index)}
                aria-pressed={isSelected}
                title={`${selectedYear} 年${month.label} ${month.ganZhi} · 十神：${shiShen}\n${
                  SHI_SHEN_TIPS[shiShen] ?? ""
                }\n${shenShaTitle(hits)}`}
                className={`cursor-pointer rounded-md border px-1 py-1.5 text-center transition-colors ${
                  isSelected
                    ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/25"
                    : "border-amber-500/10 bg-white/[0.02] hover:border-amber-400/30 hover:bg-amber-500/[0.05]"
                }`}
              >
                <p className={`text-[10px] ${isSelected ? "text-amber-300" : "text-zinc-500"}`}>
                  {month.label}
                  {isCurrent ? <span className="ml-0.5 text-amber-400">今</span> : null}
                </p>
                <p className={`font-serif text-sm tracking-widest ${isSelected ? "text-amber-200" : "text-zinc-200"}`}>
                  {month.ganZhi}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[9px] leading-3 text-zinc-500">{shiShen}</p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
                  {hits.length === 0 ? (
                    <span className="text-[9px] leading-3 text-zinc-600">无神煞</span>
                  ) : (
                    <>
                      {hits.slice(0, 3).map((hit) => (
                        <span
                          key={hit.name}
                          className={`rounded border border-amber-500/15 bg-white/[0.03] px-1 text-[9px] leading-3 ${ELEMENT_TEXT[hit.element]}`}
                        >
                          {hit.name}
                        </span>
                      ))}
                      {hits.length > 3 ? (
                        <span className="text-[9px] leading-3 text-zinc-500">+{hits.length - 3}</span>
                      ) : null}
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-[9px] leading-3">
                  {isSelected ? (
                    <span className="text-amber-300">已选</span>
                  ) : isCurrent ? (
                    <span className="text-amber-500/80">当前月令</span>
                  ) : (
                    <span className="text-transparent">·</span>
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type RelationType = "冲" | "合" | "害" | "刑";

const RELATION_COLORS: Record<RelationType, string> = {
  冲: "#f87171",
  合: "#34d399",
  害: "#fbbf24",
  刑: "#c084fc",
};

/** SVG 节点文字配色，与表格的五行色保持一致。 */
const ELEMENT_FILL: Record<Element, string> = {
  木: "#86efac",
  火: "#fda4af",
  土: "#fcd34d",
  金: "#e4e4e7",
  水: "#7dd3fc",
};

const GAN_HE_PAIRS: ReadonlyArray<readonly [Gan, Gan]> = [
  ["甲", "己"],
  ["乙", "庚"],
  ["丙", "辛"],
  ["丁", "壬"],
  ["戊", "癸"],
];
const GAN_CHONG_PAIRS: ReadonlyArray<readonly [Gan, Gan]> = [
  ["甲", "庚"],
  ["乙", "辛"],
  ["丙", "壬"],
  ["丁", "癸"],
];
const ZHI_HE_PAIRS: ReadonlyArray<readonly [Zhi, Zhi]> = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];
const ZHI_CHONG_PAIRS: ReadonlyArray<readonly [Zhi, Zhi]> = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];
const ZHI_HAI_PAIRS: ReadonlyArray<readonly [Zhi, Zhi]> = [
  ["子", "未"],
  ["丑", "午"],
  ["寅", "巳"],
  ["卯", "辰"],
  ["申", "亥"],
  ["酉", "戌"],
];
/** 相刑：子卯、寅巳申、丑戌未三组，以及辰午酉亥自刑。 */
const ZHI_XING_PAIRS = new Set([
  "子卯",
  "寅巳",
  "巳申",
  "寅申",
  "丑戌",
  "戌未",
  "丑未",
  "辰辰",
  "午午",
  "酉酉",
  "亥亥",
]);

function pairMatches<T extends string>(pairs: ReadonlyArray<readonly [T, T]>, a: T, b: T): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function isZhiXing(a: Zhi, b: Zhi): boolean {
  return ZHI_XING_PAIRS.has(`${a}${b}`) || ZHI_XING_PAIRS.has(`${b}${a}`);
}

interface RelationNode {
  id: string;
  char: string;
  label: string;
  x: number;
  y: number;
  element: Element;
  flow: boolean;
  /** 流年、流月天干附带的十神。 */
  shiShen?: string;
}

interface RelationLine {
  key: string;
  a: RelationNode;
  b: RelationNode;
  type: RelationType;
  flow: boolean;
}

function pushRelation(
  lines: RelationLine[],
  a: RelationNode,
  b: RelationNode,
  type: RelationType,
  flow: boolean,
) {
  lines.push({ key: `${a.id}-${b.id}-${type}`, a, b, type, flow });
}

function collectGanRelations(lines: RelationLine[], a: RelationNode, b: RelationNode, flow = false) {
  const ganA = a.char as Gan;
  const ganB = b.char as Gan;
  const isFlow = flow || a.flow || b.flow;
  if (pairMatches(GAN_HE_PAIRS, ganA, ganB)) pushRelation(lines, a, b, "合", isFlow);
  if (pairMatches(GAN_CHONG_PAIRS, ganA, ganB)) pushRelation(lines, a, b, "冲", isFlow);
}

function collectZhiRelations(lines: RelationLine[], a: RelationNode, b: RelationNode, flow = false) {
  const zhiA = a.char as Zhi;
  const zhiB = b.char as Zhi;
  const isFlow = flow || a.flow || b.flow;
  if (pairMatches(ZHI_HE_PAIRS, zhiA, zhiB)) pushRelation(lines, a, b, "合", isFlow);
  if (pairMatches(ZHI_CHONG_PAIRS, zhiA, zhiB)) pushRelation(lines, a, b, "冲", isFlow);
  if (pairMatches(ZHI_HAI_PAIRS, zhiA, zhiB)) pushRelation(lines, a, b, "害", isFlow);
  if (isZhiXing(zhiA, zhiB)) pushRelation(lines, a, b, "刑", isFlow);
}

/** 干支关系图示：原生 SVG 绘制刑冲合害连线，流年、流月互动使用虚线。 */
function RelationDiagram({
  chart,
  flowYear,
  flowMonthIndex,
}: {
  chart: ChartFacts;
  flowYear: number;
  flowMonthIndex: number;
}) {
  const flow = yearGanZhi(flowYear);
  const months = liuYueOf(flow.gan);
  const flowMonth = months[flowMonthIndex] ?? months[0];
  if (!flowMonth) return null;

  const NATAL_X = [90, 290, 490, 690] as const;
  const GAN_Y = 150;
  const ZHI_Y = 390;
  const FLOW_X = 880;
  const MONTH_X = 1080;

  const ganNodes: RelationNode[] = PILLAR_ORDER.map((key, index) => {
    const pillar = chart.pillars[key];
    return {
      id: `${key}-gan`,
      char: pillar.gan,
      label: key === "day" ? "日主" : `${pillar.label.slice(0, 1)}干`,
      x: NATAL_X[index] ?? 90,
      y: GAN_Y,
      element: ganElement(pillar.gan),
      flow: false,
    };
  });
  const zhiNodes: RelationNode[] = PILLAR_ORDER.map((key, index) => {
    const pillar = chart.pillars[key];
    return {
      id: `${key}-zhi`,
      char: pillar.zhi,
      label: `${pillar.label.slice(0, 1)}支`,
      x: NATAL_X[index] ?? 90,
      y: ZHI_Y,
      element: zhiElement(pillar.zhi),
      flow: false,
    };
  });
  const flowGanNode: RelationNode = {
    id: "flow-gan",
    char: flow.gan,
    label: "流年干",
    x: FLOW_X,
    y: GAN_Y,
    element: ganElement(flow.gan),
    flow: true,
    shiShen: shiShenOf(chart.dayMaster, flow.gan),
  };
  const flowZhiNode: RelationNode = {
    id: "flow-zhi",
    char: flow.zhi,
    label: "流年支",
    x: FLOW_X,
    y: ZHI_Y,
    element: zhiElement(flow.zhi),
    flow: true,
  };
  const flowMonthGanNode: RelationNode = {
    id: "flow-month-gan",
    char: flowMonth.gan,
    label: "流月干",
    x: MONTH_X,
    y: GAN_Y,
    element: ganElement(flowMonth.gan),
    flow: true,
    shiShen: shiShenOf(chart.dayMaster, flowMonth.gan),
  };
  const flowMonthZhiNode: RelationNode = {
    id: "flow-month-zhi",
    char: flowMonth.zhi,
    label: "流月支",
    x: MONTH_X,
    y: ZHI_Y,
    element: zhiElement(flowMonth.zhi),
    flow: true,
  };

  const lines: RelationLine[] = [];
  for (let i = 0; i < PILLAR_ORDER.length; i += 1) {
    for (let j = i + 1; j < PILLAR_ORDER.length; j += 1) {
      const ganA = ganNodes[i];
      const ganB = ganNodes[j];
      if (ganA && ganB) collectGanRelations(lines, ganA, ganB);
      const zhiA = zhiNodes[i];
      const zhiB = zhiNodes[j];
      if (zhiA && zhiB) collectZhiRelations(lines, zhiA, zhiB);
    }
    const ganA = ganNodes[i];
    if (ganA) {
      collectGanRelations(lines, ganA, flowGanNode, true);
      collectGanRelations(lines, ganA, flowMonthGanNode, true);
    }
    const zhiA = zhiNodes[i];
    if (zhiA) {
      collectZhiRelations(lines, zhiA, flowZhiNode, true);
      collectZhiRelations(lines, zhiA, flowMonthZhiNode, true);
    }
  }

  const allNodes = [...ganNodes, ...zhiNodes, flowGanNode, flowZhiNode, flowMonthGanNode, flowMonthZhiNode];

  return (
    <div className="rounded-xl border border-amber-500/25 bg-[#131009] p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h3 className="font-serif text-base text-amber-100/90">干支关系图示</h3>
        <p className="text-[11px] text-amber-500/60">
          四柱刑冲合害 · 流年 {flowYear} {flow.text} · 流月 {flowMonth.label} {flowMonth.ganZhi}
        </p>
      </div>
      <div className="mt-2 overflow-x-auto pb-1">
        <svg
          viewBox="0 0 1180 560"
          role="img"
          aria-label={`四柱干支刑冲合害关系图，含流年 ${flow.text} 与流月 ${flowMonth.ganZhi}，共 ${lines.length} 组关联`}
          className="h-auto w-full min-w-[760px]"
        >
          <text x="22" y={GAN_Y + 4} fontSize="13" fill="#b45309" letterSpacing="2">
            天干
          </text>
          <text x="22" y={ZHI_Y + 4} fontSize="13" fill="#b45309" letterSpacing="2">
            地支
          </text>
          <text x={FLOW_X} y="30" textAnchor="middle" fontSize="12" fill="#fbbf24">
            流年 {flowYear} {flow.text}
          </text>
          <text x={MONTH_X} y="30" textAnchor="middle" fontSize="12" fill="#fbbf24">
            流月 {flowMonth.ganZhi}
          </text>

          {lines.length === 0 ? (
            <text x="590" y="270" textAnchor="middle" fontSize="13" fill="#71717a">
              四柱之间未见显著刑冲合害
            </text>
          ) : null}

          {lines.map((line, index) => {
            const above = line.a.y < 300;
            const isMonthLine = line.a.id.startsWith("flow-month") || line.b.id.startsWith("flow-month");
            const magnitude = isMonthLine
              ? 120 + (index % 4) * 8
              : Math.min(54 + index * 12, 78);
            const cx = (line.a.x + line.b.x) / 2;
            const cy = line.a.y + (above ? -magnitude : magnitude);
            const mx = (line.a.x + 2 * cx + line.b.x) / 4;
            const my = (line.a.y + 2 * cy + line.b.y) / 4;
            const color = RELATION_COLORS[line.type];
            return (
              <g key={line.key}>
                <title>{`${line.a.char}${line.b.char}${line.type}${line.flow ? "（流年互动）" : ""}`}</title>
                <path
                  d={`M ${line.a.x} ${line.a.y} Q ${cx} ${cy} ${line.b.x} ${line.b.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={line.flow ? 1.6 : 2}
                  strokeDasharray={line.flow ? "7 5" : undefined}
                  opacity="0.9"
                />
                <text
                  x={mx}
                  y={my + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill={color}
                  stroke="#131009"
                  strokeWidth="5"
                  style={{ paintOrder: "stroke" }}
                >
                  {line.type}
                </text>
              </g>
            );
          })}

          {allNodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x - 32}
                y={node.y - 32}
                width="64"
                height="64"
                rx="12"
                fill="#1b1710"
                stroke={node.flow ? "#f59e0b" : "#78531f"}
                strokeWidth={node.flow ? 1.6 : 1.2}
                strokeDasharray={node.flow ? "6 4" : undefined}
              />
              <text
                x={node.x}
                y={node.y + (node.shiShen ? 8 : 12)}
                textAnchor="middle"
                fontSize="30"
                fill={ELEMENT_FILL[node.element]}
                fontFamily="ui-serif, Georgia, 'Songti SC', serif"
              >
                {node.char}
              </text>
              {node.shiShen ? (
                <text x={node.x} y={node.y + 27} textAnchor="middle" fontSize="10" fill="#fcd34d" opacity="0.9">
                  {node.shiShen}
                </text>
              ) : null}
              <text
                x={node.x}
                y={node.y + 52}
                textAnchor="middle"
                fontSize="11"
                fill={node.flow ? "#fbbf24" : "#a1a1aa"}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-zinc-400">
        {(["冲", "合", "害", "刑"] as const).map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-0.5 w-6 rounded-full"
              style={{ backgroundColor: RELATION_COLORS[type] }}
            />
            {type}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block w-6 border-t border-dashed border-amber-300" />
          流年/流月互动
        </span>
        <span className="text-zinc-500">共 {lines.length} 组</span>
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

function SelectField({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          {...props}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-amber-200/20 bg-[#1c1813] px-3 pr-8 text-sm text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-colors hover:border-amber-300/40 focus-visible:border-amber-400/70 focus-visible:ring-[3px] focus-visible:ring-amber-400/20 [&>option]:bg-[#1c1813] [&>option]:text-amber-50"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-200/60"
        />
      </div>
    </label>
  );
}
