import type { Element, Gan, PillarKey, Zhi } from "@/lib/schemas/chart-facts";

/**
 * 神煞查法基准。
 * 天乙、太极、文昌、国印按「日干或年干」查；桃花等按「日支或年支」查；
 * 孤辰、寡宿、红鸾、天喜按年支查；空亡按日柱旬空查。
 */
export type ShenShaBasis = "日干" | "年干" | "日支" | "年支" | "日柱旬空";

export interface ShenShaDefinition {
  name: string;
  /** 神煞本身的五行属性，仅用于前端配色与展示。 */
  element: Element;
  /** 按顺序尝试基准，命中即止，避免同名神煞重复出现。 */
  bases: readonly ShenShaBasis[];
  /** 基准干/支 → 目标地支；「日柱旬空」无需此表。 */
  targets: Readonly<Partial<Record<Gan | Zhi, readonly Zhi[]>>>;
}

export interface ShenShaHit {
  name: string;
  element: Element;
  /** 命中的具体依据，如「日干丙」「年干己」「日柱旬空（戌亥）」。 */
  basedOn: string;
}

type ShenShaTargets = Readonly<Partial<Record<Gan | Zhi, readonly Zhi[]>>>;

/** 天乙贵人：甲戊庚丑未，乙己子申，丙丁亥酉，壬癸卯巳，辛午寅。 */
const TIAN_YI_TARGETS: ShenShaTargets = {
  甲: ["丑", "未"],
  戊: ["丑", "未"],
  庚: ["丑", "未"],
  乙: ["子", "申"],
  己: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
  辛: ["午", "寅"],
};

/** 太极贵人：甲乙子午，丙丁卯酉，戊己辰戌丑未，庚辛寅亥，壬癸巳申。 */
const TAI_JI_TARGETS: ShenShaTargets = {
  甲: ["子", "午"],
  乙: ["子", "午"],
  丙: ["卯", "酉"],
  丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"],
  己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"],
  辛: ["寅", "亥"],
  壬: ["巳", "申"],
  癸: ["巳", "申"],
};

/** 文昌贵人：甲巳、乙午、丙戊申、丁己酉、庚亥、辛子、壬寅、癸卯。 */
const WEN_CHANG_TARGETS: ShenShaTargets = {
  甲: ["巳"],
  乙: ["午"],
  丙: ["申"],
  戊: ["申"],
  丁: ["酉"],
  己: ["酉"],
  庚: ["亥"],
  辛: ["子"],
  壬: ["寅"],
  癸: ["卯"],
};

/** 国印贵人：甲戌、乙亥、丙丑、丁寅、戊丑、己寅、庚辰、辛巳、壬未、癸申。 */
const GUO_YIN_TARGETS: ShenShaTargets = {
  甲: ["戌"],
  乙: ["亥"],
  丙: ["丑"],
  丁: ["寅"],
  戊: ["丑"],
  己: ["寅"],
  庚: ["辰"],
  辛: ["巳"],
  壬: ["未"],
  癸: ["申"],
};

/** 禄神：甲寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子。 */
const LU_SHEN_TARGETS: ShenShaTargets = {
  甲: ["寅"],
  乙: ["卯"],
  丙: ["巳"],
  戊: ["巳"],
  丁: ["午"],
  己: ["午"],
  庚: ["申"],
  辛: ["酉"],
  壬: ["亥"],
  癸: ["子"],
};

/**
 * 羊刃：取「禄前一位」口径——甲卯、乙辰、丙午、丁未、戊午、己未、庚酉、辛戌、壬子、癸丑。
 * 阴干另有帝旺口径，本工具首期只用一种，避免同名神煞多口径混用。
 */
const YANG_REN_TARGETS: ShenShaTargets = {
  甲: ["卯"],
  乙: ["辰"],
  丙: ["午"],
  丁: ["未"],
  戊: ["午"],
  己: ["未"],
  庚: ["酉"],
  辛: ["戌"],
  壬: ["子"],
  癸: ["丑"],
};

/** 三合局查法：申子辰、寅午戌、巳酉丑、亥卯未。 */
function sanHeTargets(targets: {
  申子辰: Zhi;
  寅午戌: Zhi;
  巳酉丑: Zhi;
  亥卯未: Zhi;
}): ShenShaTargets {
  return {
    申: [targets.申子辰],
    子: [targets.申子辰],
    辰: [targets.申子辰],
    寅: [targets.寅午戌],
    午: [targets.寅午戌],
    戌: [targets.寅午戌],
    巳: [targets.巳酉丑],
    酉: [targets.巳酉丑],
    丑: [targets.巳酉丑],
    亥: [targets.亥卯未],
    卯: [targets.亥卯未],
    未: [targets.亥卯未],
  };
}

const TAO_HUA_TARGETS = sanHeTargets({ 申子辰: "酉", 寅午戌: "卯", 巳酉丑: "午", 亥卯未: "子" });
const YI_MA_TARGETS = sanHeTargets({ 申子辰: "寅", 寅午戌: "申", 巳酉丑: "亥", 亥卯未: "巳" });
const HUA_GAI_TARGETS = sanHeTargets({ 申子辰: "辰", 寅午戌: "戌", 巳酉丑: "丑", 亥卯未: "未" });
const JIANG_XING_TARGETS = sanHeTargets({ 申子辰: "子", 寅午戌: "午", 巳酉丑: "酉", 亥卯未: "卯" });
const JIE_SHA_TARGETS = sanHeTargets({ 申子辰: "巳", 寅午戌: "亥", 巳酉丑: "寅", 亥卯未: "申" });
const ZAI_SHA_TARGETS = sanHeTargets({ 申子辰: "午", 寅午戌: "子", 巳酉丑: "卯", 亥卯未: "酉" });
const WANG_SHEN_TARGETS = sanHeTargets({ 申子辰: "亥", 寅午戌: "巳", 巳酉丑: "申", 亥卯未: "寅" });

/** 孤辰：亥子丑见寅、寅卯辰见巳、巳午未见申、申酉戌见亥。 */
const GU_CHEN_TARGETS: ShenShaTargets = {
  亥: ["寅"],
  子: ["寅"],
  丑: ["寅"],
  寅: ["巳"],
  卯: ["巳"],
  辰: ["巳"],
  巳: ["申"],
  午: ["申"],
  未: ["申"],
  申: ["亥"],
  酉: ["亥"],
  戌: ["亥"],
};

/** 寡宿：亥子丑见戌、寅卯辰见丑、巳午未见辰、申酉戌见未。 */
const GUA_SU_TARGETS: ShenShaTargets = {
  亥: ["戌"],
  子: ["戌"],
  丑: ["戌"],
  寅: ["丑"],
  卯: ["丑"],
  辰: ["丑"],
  巳: ["辰"],
  午: ["辰"],
  未: ["辰"],
  申: ["未"],
  酉: ["未"],
  戌: ["未"],
};

/** 红鸾：子卯、丑寅、寅丑、卯子、辰亥、巳戌、午酉、未申、申未、酉午、戌巳、亥辰。 */
const HONG_LUAN_TARGETS: ShenShaTargets = {
  子: ["卯"],
  丑: ["寅"],
  寅: ["丑"],
  卯: ["子"],
  辰: ["亥"],
  巳: ["戌"],
  午: ["酉"],
  未: ["申"],
  申: ["未"],
  酉: ["午"],
  戌: ["巳"],
  亥: ["辰"],
};

/** 天喜：红鸾对冲位。 */
const TIAN_XI_TARGETS: ShenShaTargets = {
  子: ["酉"],
  丑: ["申"],
  寅: ["未"],
  卯: ["午"],
  辰: ["巳"],
  巳: ["辰"],
  午: ["卯"],
  未: ["寅"],
  申: ["丑"],
  酉: ["子"],
  戌: ["亥"],
  亥: ["戌"],
};

/** 首期 18 个高频核心神煞，按展示优先级排列。 */
export const SHEN_SHA_DEFINITIONS: readonly ShenShaDefinition[] = [
  { name: "天乙贵人", element: "土", bases: ["日干", "年干"], targets: TIAN_YI_TARGETS },
  { name: "太极贵人", element: "土", bases: ["日干", "年干"], targets: TAI_JI_TARGETS },
  { name: "文昌贵人", element: "木", bases: ["日干", "年干"], targets: WEN_CHANG_TARGETS },
  { name: "国印贵人", element: "金", bases: ["日干", "年干"], targets: GUO_YIN_TARGETS },
  { name: "禄神", element: "木", bases: ["日干"], targets: LU_SHEN_TARGETS },
  { name: "羊刃", element: "金", bases: ["日干"], targets: YANG_REN_TARGETS },
  { name: "桃花", element: "水", bases: ["日支", "年支"], targets: TAO_HUA_TARGETS },
  { name: "驿马", element: "火", bases: ["日支", "年支"], targets: YI_MA_TARGETS },
  { name: "华盖", element: "土", bases: ["日支", "年支"], targets: HUA_GAI_TARGETS },
  { name: "将星", element: "金", bases: ["日支", "年支"], targets: JIANG_XING_TARGETS },
  { name: "劫煞", element: "金", bases: ["日支", "年支"], targets: JIE_SHA_TARGETS },
  { name: "灾煞", element: "水", bases: ["日支", "年支"], targets: ZAI_SHA_TARGETS },
  { name: "亡神", element: "水", bases: ["日支", "年支"], targets: WANG_SHEN_TARGETS },
  { name: "孤辰", element: "土", bases: ["年支"], targets: GU_CHEN_TARGETS },
  { name: "寡宿", element: "土", bases: ["年支"], targets: GUA_SU_TARGETS },
  { name: "红鸾", element: "火", bases: ["年支"], targets: HONG_LUAN_TARGETS },
  { name: "天喜", element: "火", bases: ["年支"], targets: TIAN_XI_TARGETS },
  { name: "空亡", element: "土", bases: ["日柱旬空"], targets: {} },
];

export interface ShenShaInput {
  dayGan: Gan;
  yearGan: Gan;
  dayZhi: Zhi;
  yearZhi: Zhi;
  /** 日柱旬空的两个地支，已按原顺序拆开。 */
  dayXunKong: readonly Zhi[];
  pillars: readonly { key: PillarKey; zhi: Zhi }[];
}

/** 前端计算流年、流月神煞所需的四柱基准信息。 */
export interface ShenShaBaseInfo {
  dayGan: Gan;
  yearGan: Gan;
  dayZhi: Zhi;
  yearZhi: Zhi;
  dayXunKong: readonly Zhi[];
}

interface ResolvedBase {
  label: string;
  branches: readonly Zhi[];
}

function resolveBases(definition: ShenShaDefinition, input: ShenShaInput): ResolvedBase[] {
  return definition.bases.map((basis) => {
    switch (basis) {
      case "日干":
        return { label: `日干${input.dayGan}`, branches: definition.targets[input.dayGan] ?? [] };
      case "年干":
        return { label: `年干${input.yearGan}`, branches: definition.targets[input.yearGan] ?? [] };
      case "日支":
        return { label: `日支${input.dayZhi}`, branches: definition.targets[input.dayZhi] ?? [] };
      case "年支":
        return { label: `年支${input.yearZhi}`, branches: definition.targets[input.yearZhi] ?? [] };
      case "日柱旬空":
        return { label: `日柱旬空（${input.dayXunKong.join("")}）`, branches: input.dayXunKong };
    }
  });
}

/**
 * 神煞命中算法：逐个四柱地支匹配字典。
 * 同一柱、同一神煞只保留一次；多个基准同时命中时按字典中的基准顺序取第一个。
 */
export function matchShenSha(input: ShenShaInput): Record<PillarKey, ShenShaHit[]> {
  const result: Record<PillarKey, ShenShaHit[]> = { year: [], month: [], day: [], hour: [] };

  for (const pillar of input.pillars) {
    const seen = new Set<string>();
    for (const definition of SHEN_SHA_DEFINITIONS) {
      if (seen.has(definition.name)) continue;
      const matched = resolveBases(definition, input).find((base) => base.branches.includes(pillar.zhi));
      if (!matched) continue;
      result[pillar.key].push({ name: definition.name, element: definition.element, basedOn: matched.label });
      seen.add(definition.name);
    }
  }

  return result;
}

/** 按单个目标地支查神煞，供流年、流月等动态干支复用。 */
export function shenShaForBranch(base: ShenShaBaseInfo, zhi: Zhi): ShenShaHit[] {
  return matchShenSha({ ...base, pillars: [{ key: "year", zhi }] }).year;
}
