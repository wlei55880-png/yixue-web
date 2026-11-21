import type { BaziRequest, ChartFacts } from "@/lib/schemas/chart-facts";
import type { RuleConfidence, RuleHit, RuleSchool } from "@/lib/schemas/rule-card";

export interface ReportRequest {
  chart: ChartFacts;
  hits: readonly RuleHit[];
  /** 用于岁运推演，默认取当前年份；测试可传入固定年份。 */
  currentYear?: number;
}

export interface SafetyReplacement {
  from: string;
  to: string;
  count: number;
}

export interface BaziReport {
  provider: "mock" | "llm" | "unavailable";
  model: string;
  title: string;
  markdown: string;
  text: string;
  ruleIds: string[];
  conflictGroups: string[];
  safetyReplacements: SafetyReplacement[];
}

/** 前端可见的报告：不返回规则编号与冲突组代码。 */
export type PublicBaziReport = Omit<BaziReport, "ruleIds" | "conflictGroups">;

export const REPORT_TITLE = "八字结构解读报告";

export const REPORT_CLOSING = "命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。";

export const REPORT_QUEUE_MESSAGE = "AI 正在排队中，请稍后再试。";

/** 前端可见的规则结论：不包含规则编号、判定条件、原始规则 JSON。 */
export interface PublicRuleHit {
  name: string;
  school: RuleSchool;
  confidence: RuleConfidence;
  basis: string;
  basisNote?: string;
  evidence: string[];
}

export interface PublicRuleGroup {
  label: string;
  hits: PublicRuleHit[];
}

/** 排盘接口返回：仅包含四柱事实与展示用结论。 */
export interface ChartResult {
  chart: ChartFacts;
  hits: PublicRuleHit[];
  groups: PublicRuleGroup[];
}

export interface ReportApiResponse {
  report: PublicBaziReport;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export type GenerateReportRequest =
  | { action: "chart"; birth: BaziRequest; currentYear?: number }
  | { action: "report"; birth: BaziRequest; currentYear?: number };
