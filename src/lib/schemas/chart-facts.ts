import { z } from "zod";

export const GAN_VALUES = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const ZHI_VALUES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const ELEMENT_VALUES = ["木", "火", "土", "金", "水"] as const;
export const SHI_SHEN_VALUES = [
  "日主",
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
export const DI_SHI_VALUES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;

export const GenderSchema = z.enum(["male", "female"]);
export const DaySectSchema = z.union([z.literal(1), z.literal(2)]);

export type Gender = z.infer<typeof GenderSchema>;
export type DaySect = z.infer<typeof DaySectSchema>;
export type Element = (typeof ELEMENT_VALUES)[number];

export const GanSchema = z.enum(GAN_VALUES);
export const ZhiSchema = z.enum(ZHI_VALUES);
export const ShiShenSchema = z.enum(SHI_SHEN_VALUES);
export const DiShiSchema = z.enum(DI_SHI_VALUES);
export const GanZhiSchema = z
  .string()
  .regex(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/, "干支格式不正确");

export const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;
export type PillarKey = (typeof PILLAR_KEYS)[number];

/** API 入参：公历出生时间与性别。 */
export const BaziRequestSchema = z
  .object({
    year: z.number().int().min(1900, "年份需在 1900–2100 之间").max(2100, "年份需在 1900–2100 之间"),
    month: z.number().int().min(1, "月份需在 1–12 之间").max(12, "月份需在 1–12 之间"),
    day: z.number().int().min(1, "日期需在 1–31 之间").max(31, "日期需在 1–31 之间"),
    hour: z.number().int().min(0, "小时需在 0–23 之间").max(23, "小时需在 0–23 之间"),
    minute: z.number().int().min(0, "分钟需在 0–59 之间").max(59, "分钟需在 0–59 之间"),
    gender: GenderSchema,
    sect: DaySectSchema.optional(),
  })
  .strict();

export type BaziRequest = z.infer<typeof BaziRequestSchema>;

const ResolvedInputSchema = BaziRequestSchema.extend({ sect: DaySectSchema });

const PillarSchema = z
  .object({
    key: z.enum(PILLAR_KEYS),
    label: z.enum(["年柱", "月柱", "日柱", "时柱"]),
    gan: GanSchema,
    zhi: ZhiSchema,
    ganZhi: GanZhiSchema,
    shiShenGan: ShiShenSchema,
    hideGan: z.array(GanSchema).min(1, "藏干至少一位").max(3, "藏干最多三位"),
    shiShenZhi: z.array(ShiShenSchema).min(1, "藏干十神至少一位").max(3, "藏干十神最多三位"),
    diShi: DiShiSchema,
  })
  .strict()
  .refine((pillar) => pillar.ganZhi === `${pillar.gan}${pillar.zhi}`, {
    message: "ganZhi 必须等于 gan + zhi",
    path: ["ganZhi"],
  })
  .refine((pillar) => pillar.hideGan.length === pillar.shiShenZhi.length, {
    message: "藏干与藏干十神数量必须一致",
    path: ["shiShenZhi"],
  });

const ElementCountSchema = z
  .object({
    木: z.number().int().nonnegative(),
    火: z.number().int().nonnegative(),
    土: z.number().int().nonnegative(),
    金: z.number().int().nonnegative(),
    水: z.number().int().nonnegative(),
  })
  .strict();

const WuXingSchema = z
  .object({
    visible: ElementCountSchema,
    hidden: ElementCountSchema,
    total: ElementCountSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const element of ELEMENT_VALUES) {
      if (value.total[element] !== value.visible[element] + value.hidden[element]) {
        ctx.addIssue({
          code: "custom",
          message: `${element}的总数必须等于明见数 + 藏干数`,
          path: ["total", element],
        });
      }
    }
  });

const DaYunSchema = z
  .object({
    index: z.number().int().min(1),
    ganZhi: GanZhiSchema,
    startAge: z.number().int().min(1),
    endAge: z.number().int().min(1),
    startYear: z.number().int().min(1900).max(2200),
    endYear: z.number().int().min(1900).max(2200),
  })
  .strict()
  .refine((item) => item.endAge === item.startAge + 9, { message: "大运跨度为 10 年（虚岁）", path: ["endAge"] })
  .refine((item) => item.endYear === item.startYear + 9, { message: "大运跨度为 10 年", path: ["endYear"] });

const LuckSchema = z
  .object({
    forward: z.boolean(),
    startAge: z
      .object({
        years: z.number().int().nonnegative(),
        months: z.number().int().min(0).max(11),
        days: z.number().int().min(0).max(29),
        hours: z.number().int().min(0).max(23),
      })
      .strict(),
    startSolar: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "起运时间格式应为 YYYY-MM-DD HH:mm:ss"),
    daYun: z.array(DaYunSchema).min(8, "大运列表至少 8 步").max(12, "大运列表最多 12 步"),
  })
  .strict();

export const ChartFactsSchema = z
  .object({
    input: ResolvedInputSchema,
    genderLabel: z.enum(["男", "女"]),
    solar: z
      .object({
        text: z.string().min(1),
        year: z.number().int().min(1900).max(2100),
        month: z.number().int().min(1).max(12),
        day: z.number().int().min(1).max(31),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      })
      .strict(),
    lunar: z.object({ text: z.string().min(1) }).strict(),
    dayMaster: GanSchema,
    pillars: z
      .object({
        year: PillarSchema,
        month: PillarSchema,
        day: PillarSchema,
        hour: PillarSchema,
      })
      .strict(),
    wuXing: WuXingSchema,
    luck: LuckSchema,
    conventions: z
      .object({
        sect: DaySectSchema,
        sectLabel: z.string().min(1),
        yearBoundary: z.string().min(1),
        monthBoundary: z.string().min(1),
        timezone: z.string().min(1),
        luckStartMethod: z.string().min(1),
      })
      .strict(),
  })
  .strict()
  .superRefine((chart, ctx) => {
    if (chart.dayMaster !== chart.pillars.day.gan) {
      ctx.addIssue({ code: "custom", message: "dayMaster 必须等于日柱天干", path: ["dayMaster"] });
    }
    if (chart.pillars.day.shiShenGan !== "日主") {
      ctx.addIssue({ code: "custom", message: "日柱天干十神必须为「日主」", path: ["pillars", "day", "shiShenGan"] });
    }
    for (const key of PILLAR_KEYS) {
      if (chart.pillars[key].key !== key) {
        ctx.addIssue({ code: "custom", message: `${key} 柱的 key 不匹配`, path: ["pillars", key, "key"] });
      }
    }
  });

export type ChartFacts = z.infer<typeof ChartFactsSchema>;
