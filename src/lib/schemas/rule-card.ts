import { z } from "zod";

import { ELEMENT_VALUES, GAN_VALUES, ZHI_VALUES } from "@/lib/schemas/chart-facts";

export const SCHOOL_VALUES = [
  "子平·旺衰",
  "子平·五行",
  "子平·十神",
  "子平·刑冲合害",
  "盲派·旺衰",
] as const;
export const CONFIDENCE_VALUES = ["high", "medium", "low"] as const;
export const MONTH_RELATION_VALUES = ["same", "generatesMe", "drainsMe", "controlsMe", "controlledByMe"] as const;

export const TEN_GOD_VALUES = [
  "比肩",
  "劫财",
  "食神",
  "伤官",
  "偏财",
  "正财",
  "七杀",
  "正官",
  "偏印",
  "正印",
] as const;

/** 地支六冲；规则条件只允许引用其中真实存在的冲对。 */
export const CLASH_PAIRS = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
] as const;

/** 地支暗合：取两地支藏干相合之义。 */
export const HIDDEN_COMBINE_PAIRS = [
  ["子", "巳"],
  ["寅", "丑"],
  ["卯", "申"],
  ["午", "亥"],
] as const;

/** 地支三合局（三支齐现，合化与否另论）。 */
export const TRIPLE_COMBINE_GROUPS = [
  { branches: ["申", "子", "辰"], element: "水" },
  { branches: ["亥", "卯", "未"], element: "木" },
  { branches: ["寅", "午", "戌"], element: "火" },
  { branches: ["巳", "酉", "丑"], element: "金" },
] as const;

/** 天干五合；规则只判断相合关系，合化成功与否另论。 */
export const GAN_COMBINE_PAIRS = [
  { gans: ["甲", "己"], element: "土" },
  { gans: ["乙", "庚"], element: "金" },
  { gans: ["丙", "辛"], element: "水" },
  { gans: ["丁", "壬"], element: "木" },
  { gans: ["戊", "癸"], element: "火" },
] as const;

/** 地支刑组：三刑与子卯相刑。 */
export const PUNISHMENT_GROUPS = [
  ["寅", "巳", "申"],
  ["丑", "戌", "未"],
  ["子", "卯"],
] as const;

/** 自刑地支：同支重复出现方构成自刑。 */
export const SELF_PUNISHMENT_BRANCHES = ["辰", "午", "酉", "亥"] as const;

/** 地支六害。 */
export const SIX_HARM_PAIRS = [
  ["子", "未"],
  ["丑", "午"],
  ["寅", "巳"],
  ["卯", "辰"],
  ["申", "亥"],
  ["酉", "戌"],
] as const;

const ZhiSchema = z.enum(ZHI_VALUES);
const GanSchema = z.enum(GAN_VALUES);
const TenGodSchema = z.enum(TEN_GOD_VALUES);
const MonthRelationSchema = z.enum(MONTH_RELATION_VALUES);

function isSamePair(pair: readonly [string, string], a: string, b: string): boolean {
  return (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);
}

const ConditionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("alliesShare"),
      minPercent: z.number().int().min(1, "阈值需在 1–100 之间").max(100, "阈值需在 1–100 之间"),
      includeHidden: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("alliesShareBelow"),
      maxPercent: z.number().int().min(1, "阈值需在 1–100 之间").max(100, "阈值需在 1–100 之间"),
      includeHidden: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("dayMasterRoot"),
      present: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("monthRelation"),
      relations: z.array(MonthRelationSchema).min(1).max(5),
    })
    .strict(),
  z
    .object({
      type: z.literal("elementAbsent"),
      element: z.enum(ELEMENT_VALUES),
      scope: z.enum(["visible", "total"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("visibleTenGod"),
      tenGod: TenGodSchema,
      minCount: z.number().int().min(1).max(4),
    })
    .strict(),
  z
    .object({
      type: z.literal("branchClash"),
      branches: z.tuple([ZhiSchema, ZhiSchema]),
    })
    .strict()
    .refine((value) => CLASH_PAIRS.some((pair) => isSamePair(pair, value.branches[0], value.branches[1])), {
      message: "并非有效的地支六冲对",
      path: ["branches"],
    }),
  z
    .object({
      type: z.literal("branchTripleCombine"),
      branches: z.tuple([ZhiSchema, ZhiSchema, ZhiSchema]),
    })
    .strict()
    .refine(
      (value) => TRIPLE_COMBINE_GROUPS.some((group) => group.branches.every((branch) => value.branches.includes(branch))),
      { message: "并非有效的地支三合局", path: ["branches"] },
    ),
  z
    .object({
      type: z.literal("branchHiddenCombine"),
      pairs: z.array(z.tuple([ZhiSchema, ZhiSchema])).min(1).max(6),
    })
    .strict()
    .superRefine((value, ctx) => {
      value.pairs.forEach((pair, index) => {
        if (!HIDDEN_COMBINE_PAIRS.some((known) => isSamePair(known, pair[0], pair[1]))) {
          ctx.addIssue({ code: "custom", message: "并非有效的地支暗合对", path: ["pairs", index] });
        }
      });
    }),
  z
    .object({
      type: z.literal("ganCombine"),
      pairs: z.array(z.tuple([GanSchema, GanSchema])).min(1).max(5),
    })
    .strict()
    .superRefine((value, ctx) => {
      value.pairs.forEach((pair, index) => {
        if (!GAN_COMBINE_PAIRS.some((known) => isSamePair(known.gans, pair[0], pair[1]))) {
          ctx.addIssue({ code: "custom", message: "并非有效的天干五合对", path: ["pairs", index] });
        }
      });
    }),
  z
    .object({
      type: z.literal("visibleTenGodAll"),
      tenGods: z.array(TenGodSchema).min(2).max(4),
    })
    .strict()
    .refine((value) => new Set(value.tenGods).size === value.tenGods.length, {
      message: "十神组合不可重复",
      path: ["tenGods"],
    }),
  z
    .object({
      type: z.literal("branchPunishment"),
      branches: z.array(ZhiSchema).min(2).max(3),
    })
    .strict()
    .refine((value) => new Set(value.branches).size === value.branches.length, {
      message: "刑组地支不可重复",
      path: ["branches"],
    })
    .refine(
      (value) =>
        PUNISHMENT_GROUPS.some(
          (group) => group.length === value.branches.length && group.every((branch) => value.branches.includes(branch)),
        ),
      { message: "并非有效的地支刑组", path: ["branches"] },
    ),
  z
    .object({
      type: z.literal("branchSelfPunishment"),
      branches: z.array(ZhiSchema).min(1).max(4),
    })
    .strict()
    .superRefine((value, ctx) => {
      value.branches.forEach((branch, index) => {
        if (!(SELF_PUNISHMENT_BRANCHES as readonly string[]).includes(branch)) {
          ctx.addIssue({ code: "custom", message: "并非自刑地支（辰、午、酉、亥）", path: ["branches", index] });
        }
      });
    }),
  z
    .object({
      type: z.literal("branchHarm"),
      pairs: z.array(z.tuple([ZhiSchema, ZhiSchema])).min(1).max(6),
    })
    .strict()
    .superRefine((value, ctx) => {
      value.pairs.forEach((pair, index) => {
        if (!SIX_HARM_PAIRS.some((known) => isSamePair(known, pair[0], pair[1]))) {
          ctx.addIssue({ code: "custom", message: "并非有效的地支六害对", path: ["pairs", index] });
        }
      });
    }),
]);

export type RuleCondition = z.infer<typeof ConditionSchema>;

export const RuleSourceSchema = z
  .object({
    work: z.string().min(1),
    quote: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  })
  .strict();

export const RuleOutputSchema = z
  .object({
    summary: z.string().min(1),
    caveat: z.string().min(1),
  })
  .strict();

export const RuleCardSchema = z
  .object({
    id: z.string().regex(/^bazi(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+\.\d{3}$/, "规则编号格式应为 bazi.*.NNN"),
    school: z.enum(SCHOOL_VALUES),
    source: RuleSourceSchema,
    name: z.string().min(1),
    condition: ConditionSchema,
    output: RuleOutputSchema,
    conflictGroup: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "冲突组编号格式不正确"),
    confidence: z.enum(CONFIDENCE_VALUES),
  })
  .strict();

export type RuleCard = z.infer<typeof RuleCardSchema>;
export type RuleSchool = (typeof SCHOOL_VALUES)[number];
export type RuleConfidence = (typeof CONFIDENCE_VALUES)[number];
export type TenGod = (typeof TEN_GOD_VALUES)[number];

/** 规则列表：编号唯一。 */
export const RuleCardListSchema = z
  .array(RuleCardSchema)
  .min(1)
  .superRefine((rules, ctx) => {
    const seen = new Set<string>();
    rules.forEach((rule, index) => {
      if (seen.has(rule.id)) {
        ctx.addIssue({ code: "custom", message: `规则编号重复：${rule.id}`, path: [index, "id"] });
      }
      seen.add(rule.id);
    });
  });

export const RuleHitSchema = z
  .object({
    ruleId: z.string().min(1),
    name: z.string().min(1),
    school: z.enum(SCHOOL_VALUES),
    source: RuleSourceSchema,
    confidence: z.enum(CONFIDENCE_VALUES),
    conflictGroup: z.string().min(1),
    output: RuleOutputSchema,
    evidence: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type RuleHit = z.infer<typeof RuleHitSchema>;
