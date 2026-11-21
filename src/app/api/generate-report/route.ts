import { NextResponse } from "next/server";
import { z } from "zod";

import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules, groupRuleHits } from "@/lib/engines/rules";
import { buildQueuedReport, requestBaziReport } from "@/lib/llm/gateway";
import {
  type BaziReport,
  type ChartResult,
  type PublicBaziReport,
  type PublicRuleGroup,
  type PublicRuleHit,
} from "@/lib/llm/report-types";
import { BAZI_RULES, CONFLICT_GROUP_LABELS } from "@/lib/rules/bazi";
import { BaziRequestSchema, type ChartFacts } from "@/lib/schemas/chart-facts";
import type { RuleHit } from "@/lib/schemas/rule-card";

export const runtime = "nodejs";

/**
 * 安全边界：排盘、规则匹配与 Prompt 全部只在本接口内执行。
 * 前端只能提交出生信息，拿回排盘事实与展示用结论，拿不到规则原文或 System Prompt。
 */
const GenerateReportSchema = z
  .object({
    action: z.enum(["chart", "report"]),
    birth: BaziRequestSchema,
    currentYear: z.number().int().min(1900).max(2200).optional(),
  })
  .strict();

function toPublicHit(hit: RuleHit): PublicRuleHit {
  return {
    name: hit.name,
    school: hit.school,
    confidence: hit.confidence,
    basis: hit.source.work,
    ...(hit.source.note ? { basisNote: hit.source.note } : {}),
    evidence: hit.evidence,
  };
}

function toChartResult(chart: ChartFacts, hits: readonly RuleHit[]): ChartResult {
  const groups: PublicRuleGroup[] = groupRuleHits(hits).map((group) => ({
    label: CONFLICT_GROUP_LABELS[group.conflictGroup] ?? "命理依据",
    hits: group.hits.map(toPublicHit),
  }));

  return {
    chart,
    hits: hits.map(toPublicHit),
    groups,
  };
}

function toPublicReport(report: BaziReport): PublicBaziReport {
  return {
    provider: report.provider,
    model: report.model,
    title: report.title,
    markdown: report.markdown,
    text: report.text,
    safetyReplacements: report.safetyReplacements,
  };
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "请求格式不正确，请重新排盘后再试。");
  }

  const parsed = GenerateReportSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "INVALID_BIRTH", "出生信息不完整，请检查年月日时分与性别。");
  }

  let chart: ChartFacts;
  let hits: RuleHit[];
  try {
    chart = getBaziChart(parsed.data.birth);
    hits = evaluateRules(chart, BAZI_RULES);
  } catch {
    return fail(400, "CHART_FAILED", "排盘失败，请检查出生日期是否有效。");
  }

  if (parsed.data.action === "chart") {
    return NextResponse.json(toChartResult(chart, hits));
  }

  try {
    const report = await requestBaziReport({ chart, hits, currentYear: parsed.data.currentYear });
    return NextResponse.json({ report: toPublicReport(report) });
  } catch {
    return NextResponse.json({ report: toPublicReport(buildQueuedReport({ hits })) });
  }
}
