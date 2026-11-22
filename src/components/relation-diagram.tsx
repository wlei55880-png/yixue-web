"use client";

import { liuYueOf, yearGanZhi } from "@/lib/domain/liuyue";
import { ganElement, shiShenOf, zhiElement } from "@/lib/domain/wuxing";
import type { ChartFacts, Element, Gan, PillarKey, Zhi } from "@/lib/schemas/chart-facts";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

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
export function RelationDiagram({
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
    <div className="rounded-xl border border-amber-500/25 bg-[#131009] p-2 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h3 className="font-serif text-base text-amber-100/90">干支关系图示</h3>
        <p className="text-[10px] text-amber-500/60 sm:text-[11px]">
          四柱刑冲合害 · 流年 {flowYear} {flow.text} · 流月 {flowMonth.label} {flowMonth.ganZhi}
        </p>
      </div>
      <div className="mt-2">
        <svg
          viewBox="0 0 1180 560"
          role="img"
          aria-label={`四柱干支刑冲合害关系图，含流年 ${flow.text} 与流月 ${flowMonth.ganZhi}，共 ${lines.length} 组关联`}
          className="block h-auto w-full"
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
            const magnitude = isMonthLine ? 120 + (index % 4) * 8 : Math.min(54 + index * 12, 78);
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
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10px] text-zinc-400 sm:text-[11px]">
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
