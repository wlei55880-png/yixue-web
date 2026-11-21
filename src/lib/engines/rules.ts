import {
  ELEMENT_CONTROLS,
  ELEMENT_GENERATED_BY,
  ELEMENT_GENERATES,
  ganElement,
  zhiElement,
} from "@/lib/domain/wuxing";
import type { ChartFacts, Element, PillarKey } from "@/lib/schemas/chart-facts";
import {
  HIDDEN_COMBINE_PAIRS,
  MONTH_RELATION_VALUES,
  TRIPLE_COMBINE_GROUPS,
  type RuleCard,
  type RuleCondition,
  type RuleHit,
} from "@/lib/schemas/rule-card";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

type MonthRelation = (typeof MONTH_RELATION_VALUES)[number];

const MONTH_RELATION_LABELS: Record<MonthRelation, string> = {
  same: "同气",
  generatesMe: "生我",
  drainsMe: "我生",
  controlsMe: "克我",
  controlledByMe: "我克",
};

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
    case "alliesShareBelow":
      return matchAlliesShareBelow(chart, condition);
    case "dayMasterRoot":
      return matchDayMasterRoot(chart, condition);
    case "monthRelation":
      return matchMonthRelation(chart, condition);
    case "elementAbsent":
      return matchElementAbsent(chart, condition);
    case "visibleTenGod":
      return matchVisibleTenGod(chart, condition);
    case "branchClash":
      return matchBranchClash(chart, condition);
    case "branchTripleCombine":
      return matchBranchTripleCombine(chart, condition);
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

function matchAlliesShareBelow(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "alliesShareBelow" }>,
): string[] | null {
  const dayElement = ganElement(chart.dayMaster);
  const allyElement = ELEMENT_GENERATED_BY[dayElement];
  const scope = condition.includeHidden ? chart.wuXing.total : chart.wuXing.visible;
  const allies = scope[dayElement] + scope[allyElement];
  const base = Object.values(scope).reduce((sum, count) => sum + count, 0);
  if (base === 0 || allies * 100 > condition.maxPercent * base) return null;

  const percent = ((allies / base) * 100).toFixed(1);
  return [
    `日主${chart.dayMaster}属${dayElement}，同党（${dayElement}、${allyElement}）合计 ${allies}/${base}（${percent}%），未超过阈值 ${condition.maxPercent}%`,
  ];
}

function matchDayMasterRoot(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "dayMasterRoot" }>,
): string[] | null {
  const dayElement = ganElement(chart.dayMaster);
  const roots: string[] = [];
  for (const key of PILLAR_ORDER) {
    const pillar = chart.pillars[key];
    for (const gan of pillar.hideGan) {
      if (ganElement(gan) === dayElement) {
        roots.push(`${pillar.label.replace("柱", "支")}藏${gan}`);
      }
    }
  }

  if (condition.present) {
    return roots.length > 0 ? [`日主${chart.dayMaster}在${roots.join("、")}通根（${dayElement}）`] : null;
  }
  return roots.length === 0
    ? [`四柱地支藏干均无${dayElement}，日主${chart.dayMaster}无根`]
    : null;
}

function matchMonthRelation(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "monthRelation" }>,
): string[] | null {
  const monthZhi = chart.pillars.month.zhi;
  const monthElement = zhiElement(monthZhi);
  const dayElement = ganElement(chart.dayMaster);
  const relation = monthRelationOf(monthElement, dayElement);
  if (!condition.relations.includes(relation)) return null;

  return [
    `月支${monthZhi}属${monthElement}，与日主${chart.dayMaster}（${dayElement}）的关系为「${MONTH_RELATION_LABELS[relation]}」`,
  ];
}

function monthRelationOf(monthElement: Element, dayElement: Element): MonthRelation {
  if (monthElement === dayElement) return "same";
  if (ELEMENT_GENERATES[monthElement] === dayElement) return "generatesMe";
  if (ELEMENT_GENERATES[dayElement] === monthElement) return "drainsMe";
  if (ELEMENT_CONTROLS[monthElement] === dayElement) return "controlsMe";
  return "controlledByMe";
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

function matchBranchTripleCombine(
  chart: ChartFacts,
  condition: Extract<RuleCondition, { type: "branchTripleCombine" }>,
): string[] | null {
  const positions = collectBranchPositions(chart);
  const labels: string[] = [];
  for (const branch of condition.branches) {
    const position = positions.get(branch)?.[0];
    if (!position) return null;
    labels.push(`${position}${branch}`);
  }

  const group = TRIPLE_COMBINE_GROUPS.find((item) =>
    item.branches.every((branch) => condition.branches.includes(branch)),
  );
  const element = group ? group.element : "";
  return [`${labels.join("、")}三支齐现，构成${condition.branches.join("")}三合${element}局（合化与否另论）`];
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

export interface RuleHitGroup {
  conflictGroup: string;
  hits: RuleHit[];
}

/** 按冲突组聚合命中结果，保持首次出现顺序；同组多条并列，不做单一裁决。 */
export function groupRuleHits(hits: readonly RuleHit[]): RuleHitGroup[] {
  const groups: RuleHitGroup[] = [];
  const index = new Map<string, RuleHitGroup>();
  for (const hit of hits) {
    let group = index.get(hit.conflictGroup);
    if (!group) {
      group = { conflictGroup: hit.conflictGroup, hits: [] };
      index.set(hit.conflictGroup, group);
      groups.push(group);
    }
    group.hits.push(hit);
  }
  return groups;
}
