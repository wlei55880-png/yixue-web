import { COMPLIANCE_RULES, scanCompliance, type ComplianceCategory } from "@/lib/compliance";
import { ganElement } from "@/lib/domain/wuxing";
import { groupRuleHits } from "@/lib/engines/rules";
import { CONFLICT_GROUP_LABELS } from "@/lib/rules/bazi";
import type { ChartFacts, PillarKey } from "@/lib/schemas/chart-facts";
import type { RuleConfidence, RuleHit } from "@/lib/schemas/rule-card";

export interface ReportRequest {
  chart: ChartFacts;
  hits: readonly RuleHit[];
}

export interface SafetyReplacement {
  from: string;
  to: string;
  count: number;
}

export interface BaziReport {
  provider: "mock";
  model: string;
  title: string;
  paragraphs: string[];
  disclaimer: string;
  text: string;
  ruleIds: string[];
  conflictGroups: string[];
  safetyReplacements: SafetyReplacement[];
}

export const REPORT_DISCLAIMER =
  "本报告由本地模板引擎生成，仅作传统文化学习材料，不构成医疗、法律、投资、婚姻或其他专业建议，也不承诺任何预测结果。";

const REPORT_TITLE = "八字结构解读报告";
const REPORT_MODEL = "local-template-v1";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

const CONFIDENCE_LABELS: Record<RuleConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const SEASON_BY_ZHI: Record<string, string> = {
  寅: "春",
  卯: "春",
  辰: "春",
  巳: "夏",
  午: "夏",
  未: "夏",
  申: "秋",
  酉: "秋",
  戌: "秋",
  亥: "冬",
  子: "冬",
  丑: "冬",
};

const CATEGORY_REPLACEMENTS: Record<ComplianceCategory, string> = {
  absolute_prediction: "可能",
  fear_inducement: "注意",
  paid_fate_change: "建议",
  professional_advice: "建议咨询专业人士",
};

/** 用户要求的四个硬词优先覆盖为「可能 / 建议 / 注意」口径。 */
const REQUIRED_REPLACEMENTS: Record<string, string> = {
  必定: "可能",
  注定: "可能",
  破财: "注意支出",
  改运: "建议调整",
};

function buildSafetyMappings(): { from: string; to: string }[] {
  const map = new Map<string, string>();
  for (const rule of COMPLIANCE_RULES) {
    for (const phrase of rule.phrases) {
      map.set(phrase, CATEGORY_REPLACEMENTS[rule.category]);
    }
  }
  for (const [phrase, replacement] of Object.entries(REQUIRED_REPLACEMENTS)) {
    map.set(phrase, replacement);
  }
  return [...map.entries()]
    .map(([from, to]) => ({ from, to }))
    .sort((left, right) => right.from.length - left.from.length);
}

/** 安全词表：长词优先，避免「破财免灾」被拆成半截替换。 */
export const SAFETY_MAPPINGS: readonly { from: string; to: string }[] = buildSafetyMappings();

/** 报告文本安全过滤：命中合规词表即替换为条件性、建议性表述。 */
export function sanitizeReportText(input: string): { text: string; replacements: SafetyReplacement[] } {
  let text = input;
  const counts = new Map<string, { to: string; count: number }>();

  for (const { from, to } of SAFETY_MAPPINGS) {
    if (!text.includes(from)) continue;
    const count = text.split(from).length - 1;
    text = text.split(from).join(to);
    const previous = counts.get(from);
    counts.set(from, { to, count: (previous?.count ?? 0) + count });
  }

  // 兜底：若仍有词表残留，统一替换为中性表述，保证输出可上线。
  for (const hit of scanCompliance(text)) {
    text = text.split(hit.phrase).join("需留意");
    counts.set(hit.phrase, { to: "需留意", count: 1 });
  }

  return {
    text,
    replacements: [...counts.entries()].map(([from, value]) => ({ from, to: value.to, count: value.count })),
  };
}

/**
 * 本地模板报告生成器（mock provider）。
 * 只读取排盘事实与命中规则，不发起任何外部请求；相同输入始终得到相同输出。
 */
export function generateBaziReport({ chart, hits }: ReportRequest): BaziReport {
  const groups = groupRuleHits(hits);
  const paragraphs: string[] = [];

  const dayElement = ganElement(chart.dayMaster);
  const season = SEASON_BY_ZHI[chart.pillars.month.zhi] ?? "四季";
  const pillars = PILLAR_ORDER.map((key) => chart.pillars[key].ganZhi).join(" ");

  paragraphs.push(
    `您的日主为${chart.dayMaster}${dayElement}，生于${season}季（月支${chart.pillars.month.zhi}），四柱为「${pillars}」，${chart.genderLabel}命。`,
  );

  if (hits.length === 0) {
    paragraphs.push(
      "本次排盘未命中当前知识库的规则。这可能说明命局的主要特征尚未被现有规则覆盖，也可能需要结合大运与流年进一步观察；本报告不据此展开推断。",
    );
  } else {
    const groupNames = [
      ...new Set(groups.map((group) => CONFLICT_GROUP_LABELS[group.conflictGroup] ?? group.conflictGroup)),
    ];
    const overview = groupNames.slice(0, 4).join("、");
    paragraphs.push(
      `本次排盘共命中 ${hits.length} 条规则，涉及${overview}${groupNames.length > 4 ? "等" : ""}角度。`,
    );

    const details = hits.slice(0, 2).map((hit) => {
      const evidence = hit.evidence[0] ?? "排盘事实与规则条件一致";
      return `「${hit.name}」（${hit.school}，置信度${CONFIDENCE_LABELS[hit.confidence]}）可作观察线索：${hit.output.summary}依据是${evidence}。`;
    });
    paragraphs.push(details.join(""));

    const conflictGroups = groups.filter((group) => group.hits.length > 1);
    if (conflictGroups.length > 0) {
      const conflictLines = conflictGroups.slice(0, 2).map((group) => {
        const label = CONFLICT_GROUP_LABELS[group.conflictGroup] ?? group.conflictGroup;
        const schools = [...new Set(group.hits.map((hit) => hit.school))].join("、");
        return `在「${label}」上，${schools} 给出并列判断，本报告保留分歧，不做单一裁决。`;
      });
      paragraphs.push(conflictLines.join(""));
    }

    if (hits.length > 2) {
      paragraphs.push(`其余 ${hits.length - 2} 条命中的规则可在上方规则面板逐条查看，并结合排盘事实自行核对。`);
    }

    paragraphs.push(
      "以上内容只是规则层面的结构提示，单一规则不足以对命局定性；可结合现实经历核对，不宜据此作重大决定。",
    );
  }

  const body = paragraphs.join("\n\n");
  const sanitized = sanitizeReportText(`${body}\n\n${REPORT_DISCLAIMER}`);

  return {
    provider: "mock",
    model: REPORT_MODEL,
    title: REPORT_TITLE,
    paragraphs: sanitized.text.split("\n\n"),
    disclaimer: REPORT_DISCLAIMER,
    text: sanitized.text,
    ruleIds: hits.map((hit) => hit.ruleId),
    conflictGroups: groups.filter((group) => group.hits.length > 1).map((group) => group.conflictGroup),
    safetyReplacements: sanitized.replacements,
  };
}
