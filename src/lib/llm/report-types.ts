import type { ChartFacts } from "@/lib/schemas/chart-facts";
import type { RuleHit } from "@/lib/schemas/rule-card";

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

export const REPORT_TITLE = "八字结构解读报告";

export const REPORT_CLOSING = "命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。";

export const REPORT_QUEUE_MESSAGE = "AI 正在排队中，请稍后再试。";
