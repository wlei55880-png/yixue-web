import { ELEMENT_GENERATED_BY, ganElement } from "@/lib/domain/wuxing";
import type { ChartFacts, PillarKey } from "@/lib/schemas/chart-facts";
import {
  HIDDEN_COMBINE_PAIRS,
  type RuleCard,
  type RuleCondition,
  type RuleHit,
} from "@/lib/schemas/rule-card";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

/** 暗合的藏干相合原理，用于命中证据。 */
const HIDDEN_COMBINE_DETAILS: Record<string, string> = {
  子巳: "子藏癸、巳藏戊，戊癸相合",
  寅丑: "寅藏甲丙戊、丑藏己癸辛，甲己、丙辛相合",
  卯申: "卯藏乙、申藏庚，乙庚相合",
  午亥: "午藏丁己、亥藏壬甲，丁壬、甲己相合",
};

/**
 * 规则执行器：对 ChartFacts 逐条求值，返回命中的规则及其证据。
 * 纯函数，不读写全局状态，不涉及任何模型推断。
 */
export function evaluateRules(chart: ChartFacts, rules: readonly RuleCard[]): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const rule of rules) {
    const evidence = matchCondition(chart, rule.condition);
    if (!evidence) continue;
    hits.push({
      ruleId: rule.id,
      name: rule.name,
      school: rule.school,
      source: rule.source,
      confidence: rule.confidence,
      conflictGroup: rule.conflictGroup,
      output: rule.output,
      evidence,
    });
  }
  return hits;
}

function matchCondition(chart: ChartFacts, condition: RuleCondition): string[] | null {
  switch (condition.type) {
    case "alliesShare":
      return matchAlliesShare(chart, condition);
    case "elementAbsent":
      return matchElementAbsent(chart, condition);
    case "visibleTenGod":
      return matchVisibleTenGod(chart, condition);
    case "branchClash":
      return matchBranchClash(chart, condition);
    case "branchHiddenCombine":
      return matchBranchHiddenCombine(chart, condition);
  }
}

function matchAlliesShare(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "alliesShare" }>,
): string[] | null {
  const dayElement = ganElement(chart.dayMaster);
  const allyElement = ELEMENT_GENERATED_BY[dayElement];
  const scope = condition.includeHidden ? chart.wuXing.total : chart.wuXing.visible;
  const allies = scope[dayElement] + scope[allyElement];
  const base = Object.values(scope).reduce((sum, count) => sum + count, 0);
  if (base === 0 || allies * 100 < condition.minPercent * base) return null;

  const percent = ((allies / base) * 100).toFixed(1);
  return [
    `日主${chart.dayMaster}属${dayElement}，同党（${dayElement}、${allyElement}）合计 ${allies}/${base}（${percent}%），达到阈值 ${condition.minPercent}%`,
  ];
}

function matchElementAbsent(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "elementAbsent" }>,
): string[] | null {
  const { element, scope } = condition;
  if (chart.wuXing[scope][element] !== 0) return null;

  if (scope === "total") {
    return [
      `五行合计中「${element}」为 0（明见 ${chart.wuXing.visible[element]}、藏干 ${chart.wuXing.hidden[element]}）`,
    ];
  }
  return [
    `四柱明见干支中「${element}」为 0（藏干另有 ${chart.wuXing.hidden[element]}）`,
  ];
}

function matchVisibleTenGod(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "visibleTenGod" }>,
): string[] | null {
  const matched = PILLAR_ORDER.filter((key) => chart.pillars[key].shiShenGan === condition.tenGod);
  if (matched.length < condition.minCount) return null;

  const positions = matched.map((key) => {
    const pillar = chart.pillars[key];
    return `${pillar.label.charAt(0)}干${pillar.gan}为${condition.tenGod}`;
  });
  return [`${positions.join("、")}，共 ${matched.length} 处`];
}

function matchBranchClash(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "branchClash" }>,
): string[] | null {
  const [left, right] = condition.branches;
  const positions = collectBranchPositions(chart);
  const leftPositions = positions.get(left) ?? [];
  const rightPositions = positions.get(right) ?? [];
  if (leftPositions.length === 0 || rightPositions.length === 0) return null;

  const evidence: string[] = [];
  for (const leftPosition of leftPositions) {
    for (const rightPosition of rightPositions) {
      evidence.push(`${leftPosition}${left} 与 ${rightPosition}${right} 构成${left}${right}冲`);
    }
  }
  return evidence;
}

function matchBranchHiddenCombine(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "branchHiddenCombine" }>,
): string[] | null {
  const positions = collectBranchPositions(chart);
  const evidence: string[] = [];

  for (const [left, right] of condition.pairs) {
    const leftPositions = positions.get(left) ?? [];
    const rightPositions = positions.get(right) ?? [];
    if (leftPositions.length === 0 || rightPositions.length === 0) continue;

    const detail = HIDDEN_COMBINE_DETAILS[canonicalPair(left, right)] ?? "藏干相合";
    for (const leftPosition of leftPositions) {
      for (const rightPosition of rightPositions) {
        evidence.push(`${leftPosition}${left} 与 ${rightPosition}${right} 暗合（${detail}）`);
      }
    }
  }

  return evidence.length > 0 ? evidence : null;
}

function collectBranchPositions(chart: ChartFacts): Map<string, string[]> {
  const positions = new Map<string, string[]>();
  for (const key of PILLAR_ORDER) {
    const pillar = chart.pillars[key];
    const list = positions.get(pillar.zhi) ?? [];
    list.push(pillar.label.replace("柱", "支"));
    positions.set(pillar.zhi, list);
  }
  return positions;
}

function canonicalPair(left: string, right: string): string {
  const pair = HIDDEN_COMBINE_PAIRS.find(
    ([first, second]) => (first === left && second === right) || (first === right && second === left),
  );
  return pair ? `${pair[0]}${pair[1]}` : `${left}${right}`;
}
